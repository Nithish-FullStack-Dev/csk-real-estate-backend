import TeamLeads from "../modals/TeamLeadmanagement.js";
import User from "../modals/user.js";

// CREATE a new Team Lead mapping (Sales agent under a Team Lead)
export const createTeamLeadMapping = async (req, res) => {
  try {
    const { salesId, teamLeadId, performance, status } = req.body;

    const exists = await TeamLeads.findOne({ salesId });
    if (exists) {
      return res.status(400).json({ error: "Sales agent already mapped." });
    }

    const newEntry = new TeamLeads({
      salesId,
      teamLeadId: teamLeadId || null,
      performance: performance || {},
      status: status || "active",
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create team member", details: error });
  }
};

// READ all team members
export const getAllTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamLeads.find()
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
    const member = await TeamLeads.findOne({ salesId })
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
    const { id: salesId } = req.params;
    const loggedInUserId = req.user._id;

    const teamLeads = await TeamLeads.find({
      salesId,
      _id: { $ne: loggedInUserId },
    })
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
    const update = req.body;

    const updated = await TeamLeads.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

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

    const deleted = await TeamLeads.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.status(200).json({ message: "Team member deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete team member", details: error });
  }
};

export const getUnassignedTeamLead = async (req, res) => {
  try {
    // Step 1: Get all agent IDs already assigned to a team
    const assignedteamLeadIds = await TeamLeads.distinct("teamLeadId");

    // Step 2: Find agents (role: 'agent') who are NOT assigned
    const unassignedteamLead = await User.find({
      role: "team_lead",
      _id: { $nin: assignedteamLeadIds },
    }).select("-password"); // Exclude password field for safety

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
