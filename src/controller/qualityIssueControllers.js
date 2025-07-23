import QualityIssue from "../modals/qualityIssue.js";
import Project from "../modals/projects.js";
import mongoose from "mongoose";

export const createQualityIssue = async (req, res) => {
  try {
    const user = req.user._id;
    console.log(req.body);
    const {
      title,
      project, // Project ID
      unit,
      severity,
      status, // optional
      contractor,
      description, // optional
      evidenceImages
    } = req.body;

    // Validate required fields
    if (
      !user ||
      !mongoose.Types.ObjectId.isValid(user) ||
      !title ||
      !project ||
      !mongoose.Types.ObjectId.isValid(project) ||
      !unit ||
      !severity
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });
    }

    // Fetch contractor from Project
    const projectDoc = await Project.findById(project).select("contractor");
    if (!projectDoc) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Create and save the issue
    const newIssue = new QualityIssue({
      user,
      title,
      project,
      unit,
      contractor,
      severity,
      status: status || "open",
      description,
      evidenceImages
    });

    const savedIssue = await newIssue.save();
    res.status(201).json({
      message: "Quality issue created successfully",
      issue: savedIssue,
    });
  } catch (error) {
    console.error("Error creating quality issue:", error);
    res
      .status(500)
      .json({ error: "Server error while creating quality issue" });
  }
};

export const getQualityIssuesByUserId = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const issues = await QualityIssue.find({ user: userId })
      .populate({
        path: "project",
        populate: {
          path: "projectId",
          model: "Property",
          select: "basicInfo", // ✅ Select the whole basicInfo object
        },
        select: "projectId",
      })
      .populate("contractor", "name") // populates contractor name from User DB
      .sort({ reported_date: -1 }); // newest issues first

    res.status(200).json({ issues });
  } catch (error) {
    console.error("Error fetching quality issues:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching quality issues" });
  }
};

export const updateIssue = async (req, res) => {};

export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["open", "under_review", "resolved"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const issue = await QualityIssue.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(issue);
};
