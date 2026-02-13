import Lead from "../modals/leadModal.js";
import Property from "../modals/propertyModel.js";
import Commission from "../modals/commissionsModal.js";
import TeamManagement from "../modals/teamManagementModal.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const saveLead = asyncHandler(async (req, res) => {
  const leadData = req.body;
  leadData.addedBy = req.user._id;

  if (leadData.openPlot === "") leadData.openPlot = undefined;
  if (leadData.openLand === "") leadData.openLand = undefined;

  const newLead = new Lead(leadData);
  const savedLead = await newLead.save();

  res
    .status(201)
    .json(new ApiResponse(201, savedLead, "Lead saved successfully"));
});

export const getAllLeads = async (req, res) => {
  try {
    const { role, _id } = req.user;

    let query = {};

    // ADMIN & SALES MANAGER → see all
    if (role === "admin" || role === "sales_manager") {
      query = {};
    }

    // AGENT → only their leads
    else if (role === "agent") {
      query = { addedBy: _id };
    }

    // TEAM LEAD → only their team agents leads
    else if (role === "team_lead") {
      const teamAgents = await TeamManagement.find({ teamLeadId: _id }).select(
        "agentId",
      );

      const agentIds = teamAgents.map((t) => t.agentId);

      query = {
        $or: [
          { addedBy: _id }, // team lead own leads
          { addedBy: { $in: agentIds } }, // team agents leads
        ],
      };
    }

    const leads = await Lead.find(query)
      .populate("property", "projectName location propertyType")
      .populate("floorUnit", "floorNumber unitType")
      .populate("unit", "plotNo propertyType")
      .populate("openPlot", "projectName plotNo memNo")
      .populate("openLand", "projectName location landType")
      .populate("addedBy", "name email role");

    res.status(200).json({
      message: "Leads fetched successfully",
      leads,
    });
  } catch (error) {
    console.error("Error fetching leads:", error.message);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const buildLeadAccessQuery = async (user) => {
  const { role, _id } = user;

  if (role === "admin" || role === "sales_manager") {
    return {};
  }

  if (role === "agent") {
    return { addedBy: _id };
  }

  if (role === "team_lead") {
    const teamAgents = await TeamManagement.find({ teamLeadId: _id }).select(
      "agentId",
    );
    const agentIds = teamAgents.map((t) => t.agentId);

    return {
      $or: [{ addedBy: _id }, { addedBy: { $in: agentIds } }],
    };
  }

  return { addedBy: _id };
};

export const getLeadsByUserId = async (req, res) => {
  try {
    const userId = req.user._id;

    const leads = await Lead.find({ addedBy: userId })
      .populate("property", "projectName location propertyType")
      .populate("floorUnit", "floorNumber unitType")
      .populate("unit", "plotNo propertyType")
      .populate("openPlot", "projectName plotNo memNo")
      .populate("openLand", "projectName location landType")
      .populate("addedBy");
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching leads for logged-in user",
      error: error.message,
    });
  }
};

export const updateLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, _id } = req.user;

    const lead = await Lead.findById(id);

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Only admin/sales_manager OR owner agent can edit
    if (
      role !== "admin" &&
      role !== "sales_manager" &&
      lead.addedBy.toString() !== _id.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { ...req.body, lastContact: new Date() },
      { new: true, runValidators: true },
    );

    res.status(200).json({ message: "Lead updated", updatedLead });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteLeadById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, _id } = req.user;

  const lead = await Lead.findById(id);

  if (!lead) throw new ApiError(404, "Lead not found");

  if (
    role !== "admin" &&
    role !== "sales_manager" &&
    lead.addedBy.toString() !== _id.toString()
  ) {
    throw new ApiError(403, "Unauthorized");
  }

  await lead.deleteOne();

  res.status(200).json(new ApiResponse(200, lead, "Lead deleted successfully"));
});

export const getAvailableProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      "customerInfo.propertyStatus": {
        $in: ["Available", "Upcoming", "Under Construction"],
      },
    });

    res.status(200).json({ properties });
  } catch (err) {
    console.error("Error fetching available properties:", err.message);
    res
      .status(500)
      .json({ message: "Failed to fetch properties", error: err.message });
  }
};

export const getClosedLeads = asyncHandler(async (req, res) => {
  const accessQuery = await buildLeadAccessQuery(req.user);

  const commissionedLeadRecords = await Commission.find({}, "clientId").lean();
  const commissionedLeadIds = commissionedLeadRecords.map((r) =>
    r.clientId.toString(),
  );

  const closedLeads = await Lead.find({
    ...accessQuery,
    propertyStatus: "Closed",
    _id: { $nin: commissionedLeadIds },
  })

    .populate("property", "_id projectName location propertyType")
    .populate("floorUnit", "_id floorNumber unitType")
    .populate("unit", "_id plotNo propertyType totalAmount")
    .populate("addedBy", "name email role avatar");

  res
    .status(200)
    .json(
      new ApiResponse(200, closedLeads, "Closed leads fetched successfully"),
    );
});

export const getLeadsByUnitId = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) throw new ApiError(400, "Unit id missing");
  const accessQuery = await buildLeadAccessQuery(req.user);

  const leads = await Lead.find({
    unit: _id,
    ...accessQuery,
  })
    .populate("property", "_id projectName location propertyType")
    .populate("floorUnit", "_id floorNumber unitType")
    .populate("unit", "_id plotNo propertyType totalAmount")
    .populate("addedBy", "name email role avatar");

  if (!leads || leads.length === 0)
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No leads found for the given unit id"));
  res
    .status(200)
    .json(new ApiResponse(200, leads, "Leads fetched successfully"));
});

export const getLeadsByOpenPlotId = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) throw new ApiError(400, "Open plot id missing");
  const accessQuery = await buildLeadAccessQuery(req.user);

  const leads = await Lead.find({
    openPlot: _id,
    ...accessQuery,
  })
    .populate("property", "_id projectName location propertyType")
    .populate("floorUnit", "_id floorNumber unitType")
    .populate("openPlot", "_id plotNo memNo")
    .populate("addedBy", "name email role avatar");
  if (!leads || leads.length === 0)
    throw new ApiError(404, "No leads found for the given open plot id");
  res
    .status(200)
    .json(new ApiResponse(200, leads, "Leads fetched successfully"));
});

export const getLeadsByOpenLandId = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) throw new ApiError(400, "Open land id missing");
  const accessQuery = await buildLeadAccessQuery(req.user);

  const leads = await Lead.find({
    openLand: _id,
    ...accessQuery,
  })
    .populate("property", "_id projectName location propertyType")
    .populate("openLand", "_id location landType")
    .populate("addedBy", "name email role avatar");
  if (!leads || leads.length === 0)
    throw new ApiError(404, "No leads found for the given open land id");
  res
    .status(200)
    .json(new ApiResponse(200, leads, "Leads fetched successfully"));
});
