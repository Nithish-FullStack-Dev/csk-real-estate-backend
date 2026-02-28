import SiteVisit from "../modals/siteVisitModal.js";
import User from "../modals/user.js";
import TeamManagement from "../modals/teamManagementModal.js";
import Lead from "../modals/leadModal.js";
import { buildLeadAccessQuery } from "./leadController.js";
import CarAllocation from "../modals/carAllocation.js";

const buildSiteVisitAccessQuery = async (user) => {
  const { role, _id } = user;

  // ADMIN & SALES MANAGER → full access
  if (role === "admin" || role === "sales_manager") {
    return {};
  }

  // AGENT → own visits only
  if (role === "agent") {
    return { bookedBy: _id };
  }

  // TEAM LEAD → their agents visits + own
  if (role === "team_lead") {
    const teamAgents = await TeamManagement.find({ teamLeadId: _id }).select(
      "agentId",
    );
    const agentIds = teamAgents.map((t) => t.agentId);

    return {
      $or: [{ bookedBy: _id }, { bookedBy: { $in: agentIds } }],
    };
  }

  return { bookedBy: _id };
};

//* CREATE a new site visit

export const createSiteVisit = async (req, res) => {
  try {
    const accessQuery = await buildLeadAccessQuery(req.user);

    const lead = await Lead.findOne({
      _id: req.body.clientId,
      isDeleted: false,
      ...accessQuery,
    });

    if (!lead) {
      return res.status(403).json({ error: "Unauthorized lead selection" });
    }

    // VEHICLE VALIDATION
    // VEHICLE VALIDATION
    if (req.body.vehicleId) {
      const vehicle = await CarAllocation.findById(req.body.vehicleId);

      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      if (vehicle.status !== "available" && vehicle.status !== "assigned") {
        return res.status(400).json({ error: "Vehicle not available" });
      }
    }

    const siteVisit = new SiteVisit({
      clientId: req.body.clientId,
      priority: req.body.priority,
      date: req.body.date,
      time: req.body.time,
      notes: req.body.notes,
      bookedBy: req.user._id,
      status: "pending",
      createdBy: req.user._id,
      ...(req.body.vehicleId && { vehicleId: req.body.vehicleId }),
    });

    await siteVisit.save();
    res.status(201).json(siteVisit);
  } catch (error) {
    res.status(400).json({
      error: "Failed to create site visit",
      details: error,
    });
  }
};

//* READ all site visits
export const getAllSiteVisits = async (req, res) => {
  try {
    const accessQuery = await buildSiteVisitAccessQuery(req.user);

    const siteVisits = await SiteVisit.find({
      ...accessQuery,
      isDeleted: false,
    })
      .populate("vehicleId")
      .populate("bookedBy", "name email role")
      .populate({
        path: "clientId",
        model: "Lead",
        select:
          "name email propertyStatus isPropertyLead isPlotLead isLandLead property floorUnit unit openPlot innerPlot openLand",
        populate: [
          {
            path: "property",
            model: "Building",
            select: "_id projectName location propertyType",
          },
          {
            path: "floorUnit",
            model: "FloorUnit",
            select: "_id floorNumber unitType",
          },
          {
            path: "unit",
            model: "PropertyUnit",
            select: "_id plotNo propertyType totalAmount",
          },
          {
            path: "openPlot",
            model: "OpenPlot",
            select: "_id projectName openPlotNo",
          },
          {
            path: "innerPlot",
            model: "InnerPlot",
            select: "_id plotNo",
          },
          {
            path: "openLand",
            model: "OpenLand",
            select: "_id projectName location landType",
          },
          {
            path: "addedBy",
            model: "User",
            select: "name email role avatar",
          },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json(siteVisits);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch site visits",
      details: error.message,
    });
  }
};

export const getMyTeamSiteVisits = async (req, res) => {
  if (req.user.role !== "team_lead") {
    return res.status(403).json({ error: "Only team leads allowed" });
  }

  try {
    const teamLeadId = req.user._id;

    // 1️⃣ find agents under this TL
    const teamAgents = await TeamManagement.find({
      teamLeadId,
      isDeleted: false,
    }).select("agentId");

    const agentIds = teamAgents.map((t) => t.agentId);

    // 2️⃣ fetch site visits booked by those agents
    const visits = await SiteVisit.find({
      bookedBy: { $in: agentIds },
      isDeleted: false,
    })
      .populate("bookedBy", "name email role avatar")
      .populate("vehicleId")
      .populate({
        path: "clientId",
        model: "Lead",
        select:
          "name email propertyStatus isPropertyLead isPlotLead isLandLead property floorUnit unit openPlot innerPlot openLand",
        populate: [
          {
            path: "property",
            model: "Building",
            select: "_id projectName location propertyType",
          },
          {
            path: "floorUnit",
            model: "FloorUnit",
            select: "_id floorNumber unitType",
          },
          {
            path: "unit",
            model: "PropertyUnit",
            select: "_id plotNo propertyType totalAmount",
          },
          {
            path: "addedBy",
            model: "User",
            select: "name email role avatar",
          },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json(visits);
  } catch (error) {
    console.error("TL site visit error:", error);
    res.status(500).json({ error: "Failed to fetch TL site visits" });
  }
};

//* get site visits by id
export const getSiteVisitById = async (req, res) => {
  try {
    const accessQuery = await buildSiteVisitAccessQuery(req.user);
    const { bookedBy } = req.params;

    const siteVisits = await SiteVisit.find({
      bookedBy,
      isDeleted: false,
      ...accessQuery,
    })
      .populate({
        path: "clientId",
        model: "Lead",
        select:
          "name email propertyStatus isPropertyLead isPlotLead isLandLead property floorUnit unit openPlot innerPlot openLand",
        populate: [
          {
            path: "property",
            model: "Building",
            select: "_id projectName location propertyType",
          },
          {
            path: "floorUnit",
            model: "FloorUnit",
            select: "_id floorNumber unitType",
          },
          {
            path: "unit",
            model: "PropertyUnit",
            select: "_id plotNo propertyType totalAmount",
          },
          {
            path: "addedBy",
            model: "User",
            select: "name email role avatar",
          },
        ],
      })
      .populate("vehicleId")
      .populate("bookedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(siteVisits);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching site visits", details: error.message });
  }
};

//* UPDATE a site visit
export const updateSiteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const accessQuery = await buildSiteVisitAccessQuery(req.user);

    const visit = await SiteVisit.findOne({
      _id: id,
      isDeleted: false,
      ...accessQuery,
    });

    if (!visit) {
      return res.status(403).json({ error: "Unauthorized or visit not found" });
    }

    // allowed fields only
    const updatePayload = {
      priority: req.body.priority,
      date: req.body.date,
      time: req.body.time,
      notes: req.body.notes,
      updatedBy: req.user._id,
    };

    // VEHICLE VALIDATION ON UPDATE
    if (req.body.vehicleId) {
      const vehicle = await CarAllocation.findOne({
        _id: req.body.vehicleId,
        isDeleted: false,
      });

      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      if (vehicle.status !== "available" && vehicle.status !== "assigned") {
        return res.status(400).json({ error: "Vehicle not available" });
      }

      updatePayload.vehicleId = req.body.vehicleId;
    }

    const updated = await SiteVisit.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({
      error: "Failed to update site visit",
      details: error,
    });
  }
};

//* DELETE a site visit
export const deleteSiteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const accessQuery = await buildSiteVisitAccessQuery(req.user);

    const visit = await SiteVisit.findOne({
      _id: id,
      isDeleted: false,
      ...accessQuery,
    });

    if (!visit) {
      return res.status(403).json({ error: "Unauthorized or visit not found" });
    }

    await SiteVisit.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedBy: req.user._id,
    });

    res.status(200).json({ message: "Site visit deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete site visit", details: error });
  }
};

//* get site visits of agents
export const getSiteVisitOfAgents = async (req, res) => {
  try {
    const accessQuery = await buildSiteVisitAccessQuery(req.user);

    const siteVisits = await SiteVisit.find({
      ...accessQuery,
      isDeleted: false,
    })
      .populate({
        path: "bookedBy",
        model: "User",
        select: "name email role",
      })
      .populate("vehicleId")
      .populate({
        path: "clientId",
        model: "Lead",
        select:
          "name email propertyStatus isPropertyLead isPlotLead isLandLead property floorUnit unit openPlot innerPlot openLand",
        populate: [
          {
            path: "property",
            model: "Building",
            select: "_id projectName location propertyType",
          },
          {
            path: "floorUnit",
            model: "FloorUnit",
            select: "_id floorNumber unitType",
          },
          {
            path: "unit",
            model: "PropertyUnit",
            select: "_id plotNo propertyType totalAmount",
          },
          {
            path: "addedBy",
            model: "User",
            select: "name email role avatar",
          },
        ],
      });

    res.status(200).json(siteVisits);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

export const approvalOrRejectStatus = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { _id: visitId, status, approvalNotes } = req.body;

    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const accessQuery = await buildSiteVisitAccessQuery(req.user);

    const visit = await SiteVisit.findOne({
      _id: visitId,
      isDeleted: false,
      ...accessQuery,
    });

    if (!visit) {
      return res.status(404).json({ error: "Visit not found" });
    }

    if (role !== "admin" && role !== "sales_manager") {
      return res.status(403).json({ error: "Unauthorized approval" });
    }

    const updatedVisit = await SiteVisit.findByIdAndUpdate(
      visitId,
      { status, approvalNotes, updatedBy: req.user._id },
      { new: true },
    );

    res.status(200).json(updatedVisit);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
