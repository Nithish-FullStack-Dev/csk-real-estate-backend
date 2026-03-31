import QualityIssue from "../modals/qualityIssue.js";
import Project from "../modals/projects.js";
import mongoose from "mongoose";
import User from "../modals/user.js";
import { createNotification } from "../utils/notificationHelper.js";

export const createQualityIssue = async (req, res) => {
  try {
    const user = req.user._id;
    const { title, project, severity, status, contractor, description } =
      req.body;

    if (
      !user ||
      !mongoose.Types.ObjectId.isValid(user) ||
      !title ||
      !project ||
      !mongoose.Types.ObjectId.isValid(project) ||
      !severity
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });
    }

    if (contractor && !mongoose.Types.ObjectId.isValid(contractor)) {
      return res.status(400).json({ error: "Invalid contractor ID." });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ error: "Project not found." });
    }

    let imageUrls = [];

    if (req.files?.evidenceImages && Array.isArray(req.files.evidenceImages)) {
      imageUrls = req.files.evidenceImages.map(
        (file) =>
          `${req.protocol}://${req.get(
            "host",
          )}/api/uploads/images/${file.filename}`,
      );
    }

    const newIssue = new QualityIssue({
      user,
      title,
      project,
      contractor: contractor || undefined,
      severity,
      status: status || "open",
      description,
      evidenceImages: imageUrls,
    });
    newIssue.createdBy = user;
    const savedIssue = await newIssue.save();

    // 🔔 Notify Admin + Site Incharge (ADDED)
    const receivers = await User.find({
      role: { $in: ["admin", "site_incharge"] },
    }).select("_id");

    await Promise.all(
      receivers.map((u) =>
        createNotification({
          userId: u._id,
          title: "Quality Issue Reported",
          message: `A new quality issue has been reported: ${title}.`,
          triggeredBy: req.user._id,
        }),
      ),
    );

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
    const role = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    let filter = { deletedBy: null };

    if (role === "site_incharge") {
      const projects = await Project.find({
        siteIncharge: userId,
      }).select("_id");

      const projectIds = projects.map((p) => p._id);

      filter.project = { $in: projectIds };
    } else if (role === "contractor") {
      filter.contractor = userId;
    }

    const issues = await QualityIssue.find(filter)
      .populate({
        path: "project",
        populate: [
          {
            path: "projectId",
            model: "Building",
            select: "_id projectName",
          },
          {
            path: "floorUnit",
            model: "FloorUnit",
            select: "_id floorNumber unitType",
          },
          {
            path: "unit",
            model: "PropertyUnit",
            select: "_id plotNo propertyType",
          },
        ],
      })
      .populate("contractor", "_id name")
      .sort({ reported_date: -1 });

    // console.log("FILTER", filter);
    // console.log("ISSUES", issues.length);

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
  try {
    const { status } = req.body;
    const validStatuses = ["open", "under_review", "resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const issue = await QualityIssue.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: req.user._id },
      { new: true },
    );

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.json(issue);
  } catch (error) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
