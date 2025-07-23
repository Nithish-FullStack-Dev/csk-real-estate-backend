import SiteInspection from "../modals/siteInspection.js";
import mongoose from "mongoose";

export const createSiteInspection = async (req, res) => {
  try {
    const site_incharge = req.user._id;
    const {
      project,
      title,
      unit,
      date,
      status, // optional
      type,
      location,
      photos, // optional
    } = req.body;

    // ✅ Validate required fields
    if (
      !site_incharge ||
      !mongoose.Types.ObjectId.isValid(site_incharge.toString()) ||
      !project ||
      !mongoose.Types.ObjectId.isValid(project.toString()) ||
      !unit ||
      !date ||
      !type ||
      !location
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });
    }

    // ✅ Create new inspection
    const newInspection = new SiteInspection({
      site_incharge,
      project,
      title,
      unit,
      date,
      status: status || "planned",
      type,
      locations:location,
      photos: photos || [],
    });

    // ✅ Save to DB
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
  const id  = req.user._id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid site incharge ID" });
  }

  try {
    const inspections = await SiteInspection.find({ site_incharge: id })
      .populate({
        path: "project",
        populate: {
          path: "projectId", // this is confusingly named, but it points to Property
          select: "basicInfo.projectName",
        },
        select: "projectId", // include the name field so it can be populated
      })
      .sort({ date: -1 }); // optional: recent first

    res.status(200).json({ inspections });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    res.status(500).json({ error: "Server error while fetching inspections" });
  }
};

export const updateStatus = async (req, res) => {
  const { status } = req.body
  const validStatuses = ["completed", "planned"]

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" })
  }

  const issue = await SiteInspection.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  )

  res.json(issue)
};

// siteInspectionController.ts
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
