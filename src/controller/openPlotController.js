// import { uploadPdfToCloudinary } from "../config/cloudinary.js";
// src/controller/openPlotController.js

import mongoose from "mongoose";
import OpenPlot from "../modals/openPlot.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
// import { getFilePath } from "../utils/getFilePath.js";
// import { uploadFile } from "../utils/uploadFile.js";
import Customer from "../modals/customerSchema.js";
import InnerPlot from "../modals/InnerPlot.js";
import { AuditLog } from "../modals/auditLog.model.js";

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
  )}/api/uploads/images/${req.files.thumbnailUrl[0].filename}`;

  const brochureUrl = `${req.protocol}://${req.get(
    "host",
  )}/api/uploads/pdfs/${req.files.brochureUrl[0].filename}`;

  let imageUrls = [];

  if (req.files?.images && Array.isArray(req.files.images)) {
    imageUrls = req.files.images.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/api/uploads/images/${file.filename}`,
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
  const brochureRemoved =
    req.body?.brochureRemoved === "true" || req.body?.brochureRemoved === true;

  if (brochureRemoved) {
    brochureUrl = "";
  }

  /* -------- replace thumbnail -------- */
  if (req.files?.thumbnailUrl?.[0]) {
    thumbnailUrl = `${req.protocol}://${req.get(
      "host",
    )}/api/uploads/images/${req.files.thumbnailUrl[0].filename}`;
  }

  /* -------- replace brochure -------- */
  if (req.files?.brochureUrl?.[0]) {
    brochureUrl = `${req.protocol}://${req.get(
      "host",
    )}/api/uploads/pdfs/${req.files.brochureUrl[0].filename}`;
  }

  /* -------- append gallery images -------- */
  /* -------- REMOVE SELECTED IMAGES -------- */
  if (req.body?.removedImages) {
    const removed = Array.isArray(req.body.removedImages)
      ? req.body.removedImages
      : [req.body.removedImages];

    images = images.filter((img) => !removed.includes(img));
  }

  /* -------- ADD NEW IMAGES -------- */
  if (req.files?.images && Array.isArray(req.files.images)) {
    const newImages = req.files.images.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/api/uploads/images/${file.filename}`,
    );

    images = [...images, ...newImages];
  }

  const updateData = {
    ...req.body,
    thumbnailUrl,
    brochureUrl,
    images,
    updatedBy: req.user._id,
  };

  delete updateData.removedImages;
  delete updateData.brochureRemoved;

  const updatedPlot = await OpenPlot.findOneAndUpdate(
    { _id, isDeleted: false },
    updateData,
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
  let query = { isDeleted: false };

  // If logged user is customer → restrict plots
  if (req.user?.role === "customer_purchased") {
    const purchasedPlots = await Customer.find({
      customerId: req.user._id,
      purchaseType: "PLOT",
    }).select("openPlot");

    const openPlotIds = purchasedPlots.map((p) => p.openPlot).filter(Boolean);

    query._id = { $in: openPlotIds };
  }

  const openPlots = await OpenPlot.find(query).sort({ createdAt: -1 });
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

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new ApiError(400, "Invalid Open Plot ID");
  }

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // ✅ 1. Fetch open plot
    const plot = await OpenPlot.findById(_id).lean().session(session);

    if (!plot) {
      await session.abortTransaction();
      throw new ApiError(404, "Open Plot not found");
    }

    // ✅ 2. Fetch inner plots (for audit)
    const innerPlots = await InnerPlot.find({ openPlotId: _id })
      .lean()
      .session(session);

    // ✅ 3. Delete inner plots
    await InnerPlot.deleteMany({ openPlotId: _id }).session(session);

    // ✅ 4. Delete open plot
    await OpenPlot.findByIdAndDelete(_id).session(session);

    // ✅ 5. Audit log (parent + children snapshot)
    await AuditLog.create(
      [
        {
          operationType: "delete",
          database: "CSKestate",
          collectionName: "openplots",
          documentId: plot._id,
          fullDocument: {
            plot,
            innerPlots,
          },
          previousFields: plot,
          changeEventId: new mongoose.Types.ObjectId().toString(),
          userId: req.user?._id || null,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Open Plot deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
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
