// src/controller/innerPlot.controller.js

import { getFilePath } from "../utils/getFilePath.js";
import InnerPlot from "../modals/InnerPlot.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Customer from "../modals/customerSchema.js";

/* ================= CREATE INNER PLOT ================= */
export const createInnerPlot = asyncHandler(async (req, res) => {
  const {
    openPlotId,
    plotNo,
    area,
    wastageArea,
    facing,
    roadWidthFt,
    plotType,
    status,
    remarks,
  } = req.body;

  if (!openPlotId || !plotNo || !area) {
    throw new ApiError(400, "Required fields are missing");
  }

  /* 🔐 DUPLICATE VALIDATION */
  const alreadyExists = await InnerPlot.findOne({
    openPlotId,
    plotNo,
  });

  if (alreadyExists) {
    throw new ApiError(409, `Plot No ${plotNo} already exists`);
  }

  let thumbnailUrl = "";
  let images = [];

  /* ---------- FILE HANDLING ---------- */

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");

  if (thumbnailLocalPath) {
    thumbnailUrl = thumbnailLocalPath
      .replace(process.cwd(), "")
      .replace(/\\/g, "/");
  }

  if (req.files?.images) {
    images = req.files.images.map((file) =>
      file.path.replace(process.cwd(), "").replace(/\\/g, "/"),
    );
  }

  const innerPlot = await InnerPlot.create({
    openPlotId,
    plotNo,
    area,
    wastageArea,
    facing,
    roadWidthFt,
    plotType,
    status,
    remarks,
    thumbnailUrl,
    images,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, innerPlot, "Inner plot created successfully"));
});

/* ================= GET BY OPEN PLOT ================= */
export const getInnerPlotById = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  const plot = await InnerPlot.findOne({ _id });

  if (!plot) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Inner plot not found"));
  }

  return res.status(200).json(new ApiResponse(200, plot, "Inner plot fetched"));
});

/* ================= GET ALL ================= */
export const getAllInnerPlot = asyncHandler(async (req, res) => {
  const { openPlotId } = req.params;

  if (!openPlotId) {
    throw new ApiError(400, "openPlotId is required");
  }

  let query = { openPlotId };

  // If logged in user is a customer → filter purchased plots
  if (req.user?.role === "customer_purchased") {
    const purchasedPlots = await Customer.find({
      customerId: req.user._id,
      purchaseType: "PLOT",
      openPlot: openPlotId,
    }).select("innerPlot");

    const innerPlotIds = [
      ...new Set(
        purchasedPlots.map((p) => p.innerPlot?.toString()).filter(Boolean),
      ),
    ];

    query._id = { $in: innerPlotIds };
  }

  const innerPlots = await InnerPlot.find(query).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, innerPlots, "Inner plots fetched successfully"));
});

/* ================= UPDATE ================= */
export const updateInnerPlot = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  const existing = await InnerPlot.findById(_id);
  if (!existing) throw new ApiError(404, "Inner plot not found");

  let thumbnailUrl = existing.thumbnailUrl;
  let images = existing.images || [];

  /* ---------- FILE HANDLING ---------- */

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");

  if (thumbnailLocalPath) {
    thumbnailUrl = thumbnailLocalPath
      .replace(process.cwd(), "")
      .replace(/\\/g, "/");
  }
  if (req.files?.images) {
    const newImages = req.files.images.map((file) =>
      file.path.replace(process.cwd(), "").replace(/\\/g, "/"),
    );
    images = [...images, ...newImages];
  }
  if (req.files?.images) {
    const newImages = req.files.images.map((file) =>
      file.path.replace(process.cwd(), "").replace(/\\/g, "/"),
    );
    images = [...images, ...newImages];
  }

  /* ---------- BODY FIX ---------- */

  const body = { ...req.body };

  if (body.area) body.area = Number(body.area);
  if (body.wastageArea) body.wastageArea = Number(body.wastageArea);
  if (body.roadWidthFt) body.roadWidthFt = Number(body.roadWidthFt);

  if (req.body.plotNo) {
    const duplicate = await InnerPlot.findOne({
      openPlotId: existing.openPlotId,
      plotNo: req.body.plotNo,
      _id: { $ne: _id },
    });

    if (duplicate) {
      throw new ApiError(409, `Plot No ${req.body.plotNo} already exists`);
    }
  }

  const updated = await InnerPlot.findByIdAndUpdate(
    _id,
    {
      ...body,
      thumbnailUrl,
      images,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Inner plot updated successfully"));
});

/* ================= DELETE ================= */
export const deleteInnerPlot = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  await InnerPlot.findByIdAndDelete(_id);

  return res.status(200).json(new ApiResponse(200, null, "Inner plot deleted"));
});

/* ================= DROPDOWN ================= */
export const getInnerPlotDropdown = asyncHandler(async (req, res) => {
  const { openPlotId } = req.params;

  const innerPlots = await InnerPlot.find({ openPlotId });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        innerPlots,
        "Inner plot dropdown fetched successfully",
      ),
    );
});
