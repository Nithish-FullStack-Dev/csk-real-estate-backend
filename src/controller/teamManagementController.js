import TeamManagement from "../modals/teamManagementModal.js";
import User from "../modals/user.js";

// 1. CREATE TEAM AGENT
export const addTeamMember = async (req, res) => {
  try {
    const { agentId, status, performance, teamLeadId } = req.body;

    // Create a new TeamAgent document
    const teamAgent = new TeamManagement({
      agentId,
      status,
      performance,
      teamLeadId,
    });

    // Save the new team agent to the database
    await teamAgent.save();

    res
      .status(201)
      .json({ message: "Team member added successfully", teamAgent });
  } catch (error) {
    console.error("Error adding team member:", error); // Log the error for debugging
    res
      .status(500)
      .json({ message: "Failed to add team member", error: error.message });
  }
};
// 2. FETCH ALL AGENTS FOR A TEAM LEAD
export const getAllAgentsByTeamLead = async (req, res) => {
  try {
    const { id: teamLeadId } = req.params;
    const loggedInUserId = req.user._id;

    const agents = await TeamManagement.find({
      teamLeadId,
      _id: { $ne: loggedInUserId },
    })
      .populate("agentId")
      .populate("teamLeadId");

    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch agents", error });
  }
};

// 3. UPDATE TEAM AGENT BY ID
export const updateTeamAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedAgent = await TeamManagement.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updatedAgent) {
      return res.status(404).json({ message: "Team agent not found" });
    }
    res.status(200).json({ message: "Team agent updated", updatedAgent });
  } catch (error) {
    res.status(500).json({ message: "Failed to update team agent", error });
  }
};

// 4. DELETE TEAM AGENT BY ID
export const deleteTeamAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TeamManagement.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Team agent not found" });
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
    const agent = await TeamManagement.findById(id);
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
    // Step 1: Get all agent IDs already assigned to a team
    const assignedAgentIds = await TeamManagement.distinct("agentId");

    // Step 2: Find agents (role: 'agent') who are NOT assigned
    const unassignedAgents = await User.find({
      role: "agent",
      _id: { $nin: assignedAgentIds },
    }).select("-password"); // Exclude password field for safety

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
