// src/controller/openPlotController.js

import mongoose from "mongoose";
import { uploadPdfToCloudinary } from "../config/cloudinary.js";
import OpenPlot from "../modals/openPlot.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";

/* ========================================================= */
/* CREATE OPEN PLOT */
/* ========================================================= */

export const createOpenPlot = asyncHandler(async (req, res) => {
  const {
    projectName,
    openPlotNo,
    location,
    totalArea,
    areaUnit,
    facing,
    roadWidthFt,
    titleStatus,
    status,
    remarks,
    surveyNo,
    approvalAuthority,
    googleMapsLocation,
    reraNo,
    documentNo,
    boundaries,
  } = req.body;

  if (
    !projectName?.trim() ||
    !openPlotNo?.trim() ||
    !location?.trim() ||
    !totalArea
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  const existingPlot = await OpenPlot.findOne({ openPlotNo });
  if (existingPlot) {
    throw new ApiError(409, "Open Plot already exists");
  }

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  const brochureLocalPath = getFilePath(req.files, "brochureUrl");

  if (!thumbnailLocalPath)
    throw new ApiError(400, "Thumbnail image is required");

  if (!brochureLocalPath) throw new ApiError(400, "Brochure PDF is required");

  const thumbnailUrl = await uploadFile(
    thumbnailLocalPath,
    "OpenPlot/Thumbnail",
  );

  const brochureUrl = await uploadPdfToCloudinary(brochureLocalPath);

  if (!thumbnailUrl || !brochureUrl) {
    throw new ApiError(500, "File upload failed");
  }

  let imageUrls = [];
  if (req.files?.images && Array.isArray(req.files.images)) {
    imageUrls = await Promise.all(
      req.files.images.map((file) => uploadFile(file.path, "OpenPlot/Gallery")),
    );
  }

  const openPlot = await OpenPlot.create({
    projectName,
    openPlotNo,
    location,
    totalArea,
    areaUnit,
    facing,
    roadWidthFt,
    titleStatus,
    status,
    remarks,
    surveyNo,
    approvalAuthority,
    reraNo,
    documentNo,
    boundaries,
    brochureUrl,
    thumbnailUrl,
    images: imageUrls,
    googleMapsLocation,
  });

  res
    .status(201)
    .json(new ApiResponse(201, openPlot, "Open Plot created successfully"));
});

/* ========================================================= */
/* UPDATE OPEN PLOT */
/* ========================================================= */

export const updateOpenPlot = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) throw new ApiError(400, "Open Plot ID required");

  const existingPlot = await OpenPlot.findById(_id);
  if (!existingPlot) throw new ApiError(404, "Open Plot not found");

  let thumbnailUrl = existingPlot.thumbnailUrl;
  let brochureUrl = existingPlot.brochureUrl;
  let images = existingPlot.images || [];

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  const brochureLocalPath = getFilePath(req.files, "brochureUrl");

  /* -------- remove brochure from UI -------- */
  if (
    req.body.brochureRemoved === "true" ||
    req.body.brochureRemoved === true
  ) {
    brochureUrl = "";
  }

  /* -------- replace brochure -------- */
  if (brochureLocalPath) {
    const uploadedBrochure = await uploadPdfToCloudinary(brochureLocalPath);
    if (!uploadedBrochure) throw new ApiError(500, "Brochure upload failed");
    brochureUrl = uploadedBrochure;
  }

  /* -------- replace thumbnail -------- */
  if (thumbnailLocalPath) {
    const uploadedThumbnail = await uploadFile(
      thumbnailLocalPath,
      "OpenPlot/Thumbnail",
    );
    if (!uploadedThumbnail) throw new ApiError(500, "Thumbnail upload failed");
    thumbnailUrl = uploadedThumbnail;
  }

  /* -------- append gallery images -------- */
  /* -------- REMOVE SELECTED IMAGES -------- */
  if (req.body.removedImages) {
    const removed = Array.isArray(req.body.removedImages)
      ? req.body.removedImages
      : [req.body.removedImages];

    images = images.filter((img) => !removed.includes(img));
  }

  /* -------- ADD NEW IMAGES -------- */
  if (req.files?.images && Array.isArray(req.files.images)) {
    const newImages = await Promise.all(
      req.files.images.map((file) => uploadFile(file.path, "OpenPlot/Gallery")),
    );

    images = [...images, ...newImages];
  }

  const updatedPlot = await OpenPlot.findByIdAndUpdate(
    _id,
    {
      ...req.body,
      thumbnailUrl,
      brochureUrl,
      images,
    },
    { new: true, runValidators: true },
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedPlot, "Open Plot updated successfully"));
});

/* ========================================================= */
/* GET ALL */
/* ========================================================= */

export const getAllOpenPlots = asyncHandler(async (req, res) => {
  const openPlots = await OpenPlot.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, openPlots));
});

/* ========================================================= */
/* GET ONE */
/* ========================================================= */

export const getOpenPlotById = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) throw new ApiError(400, "Open Plot ID required");

  const plot = await OpenPlot.findById(_id);
  if (!plot) throw new ApiError(404, "Open Plot not found");

  res.status(200).json(new ApiResponse(200, plot));
});

/* ========================================================= */
/* DELETE */
/* ========================================================= */

export const deleteOpenPlot = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) throw new ApiError(400, "Open Plot ID required");

  const plot = await OpenPlot.findById(_id);
  if (!plot) throw new ApiError(404, "Open Plot not found");

  await OpenPlot.findByIdAndDelete(_id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Open Plot deleted successfully"));
});

export const getOpenPlotDropdown = asyncHandler(async (req, res) => {
  const openPlots = await OpenPlot.find();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        openPlots,
        "Open plot dropdown fetched successfully",
      ),
    );
});
