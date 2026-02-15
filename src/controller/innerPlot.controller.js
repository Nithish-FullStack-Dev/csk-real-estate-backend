import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";
import InnerPlot from "../modals/InnerPlot.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

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

  let thumbnailUrl = "";
  let images = [];

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  if (thumbnailLocalPath) {
    thumbnailUrl = await uploadFile(thumbnailLocalPath, "InnerPlot/Thumbnail");
  }

  if (req.files?.images) {
    images = await Promise.all(
      req.files.images.map((file) =>
        uploadFile(file.path, "InnerPlot/Gallery"),
      ),
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
export const getInnerPlotsByOpenPlot = asyncHandler(async (req, res) => {
  const { openPlotId } = req.params;

  const plots = await InnerPlot.find({ openPlotId }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, plots, "Inner plots fetched"));
});

export const getAllInnerPlot = asyncHandler(async (req, res) => {
  const { openPlotId } = req.params;

  if (!openPlotId) {
    throw new ApiError(400, "openPlotId is required");
  }

  const innerPlots = await InnerPlot.find({ openPlotId }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, innerPlots, "Inner plots fetched successfully"));
});

/* ================= UPDATE ================= */
export const updateInnerPlot = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const body = req.body;

  const existing = await InnerPlot.findById(_id);
  if (!existing) throw new ApiError(404, "Inner plot not found");

  let thumbnailUrl = existing.thumbnailUrl;
  let images = existing.images || [];

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  if (thumbnailLocalPath) {
    thumbnailUrl = await uploadFile(thumbnailLocalPath, "InnerPlot/Thumbnail");
  }

  if (req.files?.images) {
    const newImages = await Promise.all(
      req.files.images.map((file) =>
        uploadFile(file.path, "InnerPlot/Gallery"),
      ),
    );
    images = [...images, ...newImages];
  }

  const updated = await InnerPlot.findByIdAndUpdate(
    _id,
    { ...body, thumbnailUrl, images },
    { new: true },
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
