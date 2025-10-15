import SiteInspection from "../modals/siteInspection.js";
import mongoose from "mongoose";

export const createSiteInspection = async (req, res) => {
  try {
    const site_incharge = req.user._id;
    const {
      project,
      title,
      unit,
      floorUnit,
      date,
      status,
      type,
      location,
      photos,
    } = req.body;

    if (
      !site_incharge ||
      !mongoose.Types.ObjectId.isValid(site_incharge.toString()) ||
      !project ||
      !mongoose.Types.ObjectId.isValid(project.toString()) ||
      !mongoose.Types.ObjectId.isValid(unit.toString()) ||
      !mongoose.Types.ObjectId.isValid(floorUnit.toString()) ||
      !title ||
      !date ||
      !type ||
      !location
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });
    }

    const newInspection = new SiteInspection({
      site_incharge,
      project,
      title,
      floorUnit,
      unit,
      date,
      status: status || "planned",
      type,
      locations: location,
      photos: photos || [],
    });

    const saved = await newInspection.save();
    res.status(201).json({
      message: "Site inspection created successfully",
      inspection: saved,
    });
  } catch (error) {
    console.error("Error creating site inspection:", error);
    res
      .status(500)
      .json({ error: "Server error while creating site inspection" });
  }
};

export const getInspectionsByIncharge = async (req, res) => {
  const id = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid site incharge ID" });
  }

  try {
    const inspections = await SiteInspection.find({ site_incharge: id })
      .populate("project", "projectName")
      .populate("floorUnit", "floorNumber")
      .populate("unit", "propertyType")
      .sort({ date: -1 });

    res.status(200).json({ inspections });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    res.status(500).json({ error: "Server error while fetching inspections" });
  }
};

export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["completed", "planned"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const issue = await SiteInspection.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(issue);
};

export const addPhotosToInspection = async (req, res) => {
  const { id } = req.params;
  const { photos } = req.body; // Array of URLs

  if (!Array.isArray(photos)) {
    return res.status(400).json({ error: "Invalid photos data" });
  }

  try {
    const updated = await SiteInspection.findByIdAndUpdate(
      id,
      { $push: { photos: { $each: photos } } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to add photos" });
  }
};
