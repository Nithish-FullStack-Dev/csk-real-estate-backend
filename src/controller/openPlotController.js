// src/controller/openPlotController.js

import mongoose from "mongoose";
import OpenPlot from "../modals/openPlot.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

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

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingPlot = await OpenPlot.findOne({
    openPlotNo,
    isDeleted: false,
  });

  if (existingPlot) {
    throw new ApiError(409, "Open Plot already exists");
  }

  /* ---------- FILE CHECK ---------- */

  if (!req.files?.thumbnailUrl?.[0]) {
    throw new ApiError(400, "Thumbnail image is required");
  }

  if (!req.files?.brochureUrl?.[0]) {
    throw new ApiError(400, "Brochure PDF is required");
  }

  /* ---------- BUILD URLS ---------- */

  const thumbnailUrl = `${req.protocol}://${req.get(
    "host",
  )}/uploads/images/${req.files.thumbnailUrl[0].filename}`;

  const brochureUrl = `${req.protocol}://${req.get(
    "host",
  )}/uploads/pdfs/${req.files.brochureUrl[0].filename}`;

  let imageUrls = [];

  if (req.files?.images && Array.isArray(req.files.images)) {
    imageUrls = req.files.images.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/uploads/images/${file.filename}`,
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
    createdBy: req.user._id,
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

  const existingPlot = await OpenPlot.findOne({ _id, isDeleted: false });
  if (!existingPlot) throw new ApiError(404, "Open Plot not found");

  let thumbnailUrl = existingPlot.thumbnailUrl;
  let brochureUrl = existingPlot.brochureUrl;
  let images = existingPlot.images || [];

  // const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  // const brochureLocalPath = getFilePath(req.files, "brochureUrl");

  /* -------- remove brochure from UI -------- */
  if (
    req.body.brochureRemoved === "true" ||
    req.body.brochureRemoved === true
  ) {
    brochureUrl = "";
  }

  /* -------- replace thumbnail -------- */
  if (req.files?.thumbnailUrl?.[0]) {
    thumbnailUrl = `${req.protocol}://${req.get(
      "host",
    )}/uploads/images/${req.files.thumbnailUrl[0].filename}`;
  }

  /* -------- replace brochure -------- */
  if (req.files?.brochureUrl?.[0]) {
    brochureUrl = `${req.protocol}://${req.get(
      "host",
    )}/uploads/pdfs/${req.files.brochureUrl[0].filename}`;
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
    const newImages = req.files.images.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/uploads/images/${file.filename}`,
    );

    images = [...images, ...newImages];
  }

  const updatedPlot = await OpenPlot.findOneAndUpdate(
    { _id, isDeleted: false },
    {
      ...req.body,
      thumbnailUrl,
      brochureUrl,
      images,
      updatedBy: req.user._id,
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
  const openPlots = await OpenPlot.find({ isDeleted: false }).sort({
    createdAt: -1,
  });
  res.status(200).json(new ApiResponse(200, openPlots));
});

/* ========================================================= */
/* GET ONE */
/* ========================================================= */

export const getOpenPlotById = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) throw new ApiError(400, "Open Plot ID required");

  const plot = await OpenPlot.findOne({ _id, isDeleted: false });
  if (!plot) throw new ApiError(404, "Open Plot not found");

  res.status(200).json(new ApiResponse(200, plot));
});

/* ========================================================= */
/* DELETE */
/* ========================================================= */

export const deleteOpenPlot = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) throw new ApiError(400, "Open Plot ID required");

  const plot = await OpenPlot.findOne({ _id, isDeleted: false });
  if (!plot) throw new ApiError(404, "Open Plot not found");

  await OpenPlot.findByIdAndUpdate(_id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: req.user._id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Open Plot deleted successfully"));
});

export const getOpenPlotDropdown = asyncHandler(async (req, res) => {
  const openPlots = await OpenPlot.find({ isDeleted: false });

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
