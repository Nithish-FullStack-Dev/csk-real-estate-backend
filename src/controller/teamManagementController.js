import TeamManagement from "../modals/teamManagementModal.js";
import User from "../modals/user.js";
import AgentModel from "../modals/agent.model.js";
import mongoose from "mongoose";
import { createNotification } from "../utils/notificationHelper.js";
import { ObjectId } from "mongodb";
// 1. CREATE TEAM AGENT
export const addTeamMember = async (req, res) => {
  try {
    const { agentId, status, performance } = req.body;

    const teamLeadId = req.user._id; // 🔥 critical

    const teamAgent = new TeamManagement({
      agentId,
      status,
      performance,
      teamLeadId,
      createdBy: req.user._id,
    });

    await teamAgent.save();

    const teamLead = await User.findById(teamLeadId).select("name");

    await createNotification({
      userId: agentId,
      title: "Added to Team",
      message: `You have been added to a team by ${teamLead?.name || "your team lead"}.`,
      triggeredBy: req.user._id,
      category: "team",
      priority: performance === "high" ? "P1" : "P2",
      deepLink: `/team-management/${teamAgent._id}`,
      entityType: "TeamManagement",
      entityId: teamAgent._id,
    });

    res.status(201).json({
      message: "Team member added successfully",
      teamAgent,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add team member",
      error: error.message,
    });
  }
};

// 2. FETCH ALL AGENTS FOR A TEAM LEAD
export const getAllAgentsByTeamLead = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const role = req.user.role;

    // ADMIN sees all
    if (role === "admin") {
      const allAgents = await TeamManagement.find({ isDeleted: false })
        .populate("agentId")
        .populate("teamLeadId");

      return res.status(200).json(allAgents);
    }

    // TEAM LEAD sees only his agents
    const agents = await TeamManagement.find({
      teamLeadId: userId,
      isDeleted: false,
    })
      .populate("agentId")
      .populate("teamLeadId");

    res.status(200).json(agents);
  } catch (error) {
    console.error("Team fetch error:", error);
    res.status(500).json({ message: "Failed to fetch agents", error });
  }
};

export const getAllTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamManagement.find({ isDeleted: false })
      .populate("agentId")
      .populate("teamLeadId");
    res.status(200).json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch team members", error });
  }
};

// 3. UPDATE TEAM AGENT BY ID
export const updateTeamAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const agent = await TeamManagement.findOne({ _id: id, isDeleted: false });

    if (!agent) {
      return res.status(404).json({ message: "Team agent not found" });
    }

    // Admin can edit all
    if (role !== "admin" && agent.teamLeadId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const updatedAgent = await TeamManagement.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...req.body, updatedBy: req.user._id },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({ message: "Team agent updated", updatedAgent });
  } catch (error) {
    res.status(500).json({ message: "Failed to update team agent", error });
  }
};

// 4. DELETE TEAM AGENT BY ID
export const deleteTeamAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const userId = req.user._id;

    // Step 1: find existing
    const agent = await TeamManagement.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!agent) {
      return res.status(404).json({ message: "Team agent not found" });
    }

    const previousAgentId = agent.agentId;

    const updated = await TeamManagement.findByIdAndDelete(id);

    if (previousAgentId) {
      await createNotification({
        userId: previousAgentId, // 👈 notify agent
        title: "Removed from Team",
        message: `You have been removed from the team.`,
        triggeredBy: req.user._id,
        category: "team",
        priority: "P2",
        deepLink: `/team-management/${agent._id}`,
        entityType: "TeamManagement",
        entityId: agent._id,
      });
    }
    res.status(200).json({ message: "Team agent deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete team agent", error });
  }
};

//  Get by ID API
export const getTeamAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await TeamManagement.findOne({ _id: id, isDeleted: false });
    if (!agent) {
      return res.status(404).json({ message: "Team agent not found" });
    }
    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch team agent", error });
  }
};

// GET /api/agents/unassigned
export const getUnassignedAgents = async (req, res) => {
  try {
    // ✅ ONLY ACTIVE assignments
    const assignedAgentIds = await TeamManagement.find({
      isDeleted: false,
      agentId: { $ne: null },
    }).distinct("agentId");

    const assignedAgentListIds = await AgentModel.distinct("agentId");

    const excludeIds = [...assignedAgentIds, ...assignedAgentListIds];

    const unassignedAgents = await User.find({
      role: "agent",
      _id: { $nin: excludeIds },
    }).select("-password");

    res.status(200).json({
      success: true,
      data: unassignedAgents,
    });
  } catch (error) {
    console.error("Error fetching unassigned agents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unassigned agents",
      error: error.message,
    });
  }
};
