import mongoose from "mongoose";
import OpenLand from "../modals/openLand.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";

// CREATE Open Land
export const createOpenLand = async (req, res) => {
  try {
    const data = req.body;

    // Check if projectName already exists (you can change unique field if needed)
    const existingLand = await OpenLand.findOne({ projectName: data.projectName });

    if (existingLand) {
      return res.status(409).json({
        success: false,
        message: "Project name already exists. Please provide a unique name.",
        error: {
          field: "projectName",
          code: "DUPLICATE_PROJECT_NAME",
        },
      });
    }

    const newLand = new OpenLand(data);
    await newLand.save();

    res.status(201).json({
      success: true,
      message: "Open land created successfully",
      land: newLand,
    });
  } catch (error) {
    console.error("Error creating open land:", error);

    if (error.code === 11000 && error.keyPattern?.projectName) {
      return res.status(409).json({
        success: false,
        message: "Project name already exists.",
        error: { field: "projectName", code: "DUPLICATE_PROJECT_NAME_DB" },
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// FETCH all Open Lands
export const getAllOpenLand = async (req, res) => {
  try {
    const lands = await OpenLand.find()
      .sort({ createdAt: -1 })
      .populate("customerId", "name email")
      .populate("agentId", "name email");

    res.status(200).json({ success: true, lands });
  } catch (error) {
    console.error("Error fetching open lands:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET one land
export const getOpenLandById = async (req, res) => {
  try {
    const { id } = req.params;
    const land = await OpenLand.findById(id)
      .populate("customerId", "name email")
      .populate("agentId", "name email");

    if (!land) {
      return res.status(404).json({ message: "Open land not found" });
    }

    res.status(200).json(land);
  } catch (error) {
    console.error("Error fetching open land:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE
export const deleteOpenLandById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid land ID",
    });
  }

  try {
    const land = await OpenLand.findByIdAndDelete(id);
    if (!land) {
      return res.status(404).json({
        success: false,
        message: "Open land not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Open land deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting land:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// UPDATE
export const updateOpenLand = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Open Land ID" });
  }

  try {
    const updatedLand = await OpenLand.findByIdAndUpdate(id, req.body, {
      new: true,
    })
      .populate("customerId", "name email")
      .populate("agentId", "name email");

    if (!updatedLand) {
      return res.status(404).json({ message: "Open Land not found" });
    }

    res.status(200).json({
      success: true,
      message: "Open land updated successfully",
      land: updatedLand,
    });
  } catch (error) {
    console.error("Error updating Open Land:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update Open Land",
      error: error.message,
    });
  }
};
