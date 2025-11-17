import mongoose from "mongoose";
import OpenLand from "../modals/openLand.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";

/**
 * Helper: populate fields consistently for OpenLand documents
 */
const populateOpenLand = (query) =>
  query
    .populate("ownerCustomer", "name phone email")
    .populate("interestedCustomers.customer", "name phone email")
    .populate("interestedCustomers.agent", "name email")
    .populate("soldToCustomer", "name phone email")
    .populate("agentId", "name email");

/* ---------------------------- CREATE ---------------------------- */
export const createOpenLand = async (req, res) => {
  try {
    const data = req.body;

    // Check if projectName already exists (optional unique constraint)
    const existingLand = await OpenLand.findOne({
      projectName: data.projectName,
    });

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

    // populate the saved document before returning
    const populated = await populateOpenLand(OpenLand.findById(newLand._id));

    res.status(201).json({
      success: true,
      message: "Open land created successfully",
      land: populated,
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

/* ---------------------------- GET ALL ---------------------------- */
export const getAllOpenLand = async (req, res) => {
  try {
    const landsQuery = OpenLand.find().sort({ createdAt: -1 });
    const lands = await populateOpenLand(landsQuery).exec();

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

/* ---------------------------- GET ONE ---------------------------- */
export const getOpenLandById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const landQuery = OpenLand.findById(id);
    const land = await populateOpenLand(landQuery).exec();

    if (!land) {
      return res.status(404).json({ message: "Open land not found" });
    }

    res.status(200).json({ success: true, land });
  } catch (error) {
    console.error("Error fetching open land:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* ---------------------------- DELETE ---------------------------- */
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

/* ---------------------------- UPDATE ---------------------------- */
export const updateOpenLand = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Open Land ID" });
  }

  try {
    // update and return new doc
    await OpenLand.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // re-fetch with populate to ensure nested fields are populated
    const updatedLand = await populateOpenLand(OpenLand.findById(id)).exec();

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
