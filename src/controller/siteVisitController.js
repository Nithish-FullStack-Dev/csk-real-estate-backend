import SiteVisit from "../modals/siteVisitModal.js";
import User from "../modals/user.js";

//* CREATE a new site visit
export const createSiteVisit = async (req, res) => {
  try {
    const siteVisit = new SiteVisit(req.body);
    await siteVisit.save();
    res.status(201).json(siteVisit);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to create site visit", details: error });
  }
};

//* READ all site visits
export const getAllSiteVisits = async (req, res) => {
  try {
    const siteVisits = await SiteVisit.find()
      .populate({
        path: "clientId",
        populate: {
          path: "property",
          model: "Property",
        },
      })
      .populate("vehicleId")
      .populate("bookedBy");

    res.status(200).json(siteVisits);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch site visits", details: error.message });
  }
};

//* get site visits by id
export const getSiteVisitById = async (req, res) => {
  try {
    const { bookedBy } = req.params;

    const siteVisits = await SiteVisit.find({ bookedBy })
      .populate({
        path: "clientId",
        populate: {
          path: "property",
          model: "Property",
        },
      })
      .populate("vehicleId");

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
    const updated = await SiteVisit.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "Site visit not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to update site visit", details: error });
  }
};

//* DELETE a site visit
export const deleteSiteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SiteVisit.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Site visit not found" });
    }

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
    const siteVisits = await SiteVisit.find()
      .populate({
        path: "bookedBy",
        match: { role: "agent" },
        select: "name email role", // Optional: pick fields
      })
      .populate("clientId")
      .populate("vehicleId");

    // Filter out those site visits where bookedBy is null (i.e., not an agent)
    const filteredVisits = siteVisits.filter(
      (visit) => visit.bookedBy !== null
    );

    res.status(200).json(filteredVisits);
  } catch (error) {
    console.error("Error fetching site visits of agents:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const approvalOrRejectStatus = async (req, res) => {
  try {
    const { _id, status, approvalNotes } = req.body;

    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updatedVisit = await SiteVisit.findByIdAndUpdate(
      _id,
      { status, approvalNotes },
      { new: true }
    );

    if (!updatedVisit) {
      return res.status(404).json({ error: "Site visit not found" });
    }

    res.status(200).json({
      message: `Site visit ${status} successfully`,
      siteVisit: updatedVisit,
    });
  } catch (error) {
    console.error("Status update failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};