import mongoose from "mongoose";
import TeamLeads from "../modals/TeamLeadmanagement.js";
import User from "../modals/user.js";
import { createNotification } from "../utils/notificationHelper.js";
import { ObjectId } from "mongodb";

// CREATE a new Team Lead mapping (Sales agent under a Team Lead)
export const createTeamLeadMapping = async (req, res) => {
  try {
    const { teamLeadId, performance, status } = req.body;

    const salesManagerId = req.user._id;

    // Validate
    if (!mongoose.Types.ObjectId.isValid(teamLeadId)) {
      return res.status(400).json({ error: "Invalid teamLeadId" });
    }

    // Ensure TL not already assigned
    const exists = await TeamLeads.findOne({
      teamLeadId,
      isDeleted: false,
    });

    if (exists) {
      return res.status(400).json({
        error: "This team lead already belongs to another manager",
      });
    }

    const newEntry = new TeamLeads({
      salesId: salesManagerId,
      teamLeadId,
      performance,
      status,
      createdBy: salesManagerId,
    });

    await newEntry.save();

    const salesUser = await User.findById(salesManagerId).select("name");

    await createNotification({
      userId: teamLeadId,
      title: "New Team Member Assigned",
      message: `You have been assigned a new sales member: ${salesUser?.name || "Unknown User"}.`,
      triggeredBy: salesManagerId,
      category: "team",
      priority: performance?.sales > 50 ? "P1" : "P2",
      deepLink: `/team-leads/${newEntry._id}`,
      entityType: "TeamLeadMapping",
      entityId: newEntry._id,
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("FULL ERROR 👉", error);
    res
      .status(500)
      .json({ error: "Failed to create team member", details: error.message });
  }
};

// READ all team members
export const getAllTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamLeads.find({ isDeleted: false })
      .populate("salesId")
      .populate("teamLeadId");
    res.status(200).json(teamMembers);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch team members", details: error });
  }
};

// READ by salesId (get agent’s team record)
export const getTeamMemberBySalesId = async (req, res) => {
  try {
    const { salesId } = req.params;
    const member = await TeamLeads.findOne({ salesId, isDeleted: false })
      .populate("salesId")
      .populate("teamLeadId");

    if (!member) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch member", details: error });
  }
};

// READ by teamLeadId (get all agents under one TL)
export const getAllTeamLeadBySales = async (req, res) => {
  try {
    const salesId = req.user._id;

    const teamLeads = await TeamLeads.find({ salesId, isDeleted: false })
      .populate("salesId")
      .populate("teamLeadId");

    res.status(200).json(teamLeads);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch team leads", error });
  }
};

// UPDATE team member details
export const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body, updatedBy: req.user._id };

    const updated = await TeamLeads.findOneAndUpdate(
      { _id: id, isDeleted: false },
      update,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update team member", details: error });
  }
};

// DELETE a team member mapping
export const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await TeamLeads.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existing) {
      return res.status(404).json({ error: "Team member not found" });
    }

    const previousTeamLeadId = existing.teamLeadId;

    const deleted = await TeamLeads.findByIdAndDelete(id);

    // const salesUser = await User.findById(deleted.salesId).select("name");

    await createNotification({
      userId: previousTeamLeadId,
      title: "Team Member Removed",
      message: `You have been removed from your team.`,
      triggeredBy: req.user._id,
      category: "team",
      priority: "P2",
      deepLink: `/team-leads/${deleted._id}`,
      entityType: "TeamLeadMapping",
      entityId: deleted._id,
    });

    res.status(200).json({ message: "Team member deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete team member", details: error });
  }
};

export const getUnassignedTeamLead = async (req, res) => {
  try {
    // ✅ Step 1: Get ONLY ACTIVE assigned team leads
    const assignedteamLeadIds = await TeamLeads.find({
      isDeleted: false, // 🔥 IMPORTANT
      teamLeadId: { $ne: null },
    }).distinct("teamLeadId");

    // ✅ Step 2: Fetch users NOT in active team
    const unassignedteamLead = await User.find({
      role: "team_lead",
      _id: { $nin: assignedteamLeadIds },
    }).select("-password");

    res.status(200).json({
      success: true,
      data: unassignedteamLead,
    });
  } catch (error) {
    console.error("Error fetching unassigned team lead:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unassigned team lead",
      error: error.message,
    });
  }
};
