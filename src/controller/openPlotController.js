import OpenPlot from "../modals/openPlot.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";

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
    reraNo,
    documentNo,
    boundaries,
  } = req.body;

  /* -------- Required Field Validation -------- */
  if (
    !projectName?.trim() ||
    !openPlotNo?.trim() ||
    !location?.trim() ||
    !totalArea
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  /* -------- Duplicate Open Plot Check -------- */
  const existingPlot = await OpenPlot.findOne({ openPlotNo });
  if (existingPlot) {
    throw new ApiError(409, "Open Plot with this number already exists");
  }

  /* -------- Thumbnail Upload (Required) -------- */
  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail image is required");
  }

  const thumbnailUrl = await uploadFile(
    thumbnailLocalPath,
    "OpenPlot/Thumbnail",
  );
  if (!thumbnailUrl) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  /* -------- Gallery Images Upload (Optional) -------- */
  let imageUrls = [];
  if (req.files?.images && Array.isArray(req.files.images)) {
    imageUrls = await Promise.all(
      req.files.images.map(async (file) => {
        const uploadedUrl = await uploadFile(file.path, "OpenPlot/Gallery");
        return uploadedUrl;
      }),
    );
  }

  /* -------- Create Open Plot -------- */
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
    thumbnailUrl,
    images: imageUrls,
  });

  const createdPlot = await OpenPlot.findById(openPlot._id);
  if (!createdPlot) {
    throw new ApiError(500, "Something went wrong while creating Open Plot");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdPlot, "Open Plot created successfully"));
});

export const updateOpenPlot = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const body = req.body;

  if (!_id) {
    throw new ApiError(400, "Open Plot ID (_id) is required");
  }

  const existingPlot = await OpenPlot.findById(_id);
  if (!existingPlot) {
    throw new ApiError(404, "Open Plot not found");
  }

  let thumbnailUrl = existingPlot.thumbnailUrl;
  let images = existingPlot.images || [];

  /* -------- Thumbnail Update (Optional) -------- */
  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  if (thumbnailLocalPath) {
    const uploadedThumbnail = await uploadFile(
      thumbnailLocalPath,
      "OpenPlot/Thumbnail",
    );
    if (!uploadedThumbnail) {
      throw new ApiError(500, "Failed to upload thumbnail");
    }
    thumbnailUrl = uploadedThumbnail;
  }

  /* -------- Add New Gallery Images (Append) -------- */
  if (req.files?.images && Array.isArray(req.files.images)) {
    const newImages = await Promise.all(
      req.files.images.map(async (file) => {
        const uploadedUrl = await uploadFile(file.path, "OpenPlot/Gallery");
        return uploadedUrl;
      }),
    );
    images = [...images, ...newImages];
  }

  /* -------- Final Update Payload -------- */
  const updatedData = {
    ...body,
    thumbnailUrl,
    images,
  };

  const updatedPlot = await OpenPlot.findByIdAndUpdate(_id, updatedData, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlot, "Open Plot updated successfully"));
});

export const getAllOpenPlots = asyncHandler(async (req, res) => {
  const openPlots = await OpenPlot.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, openPlots, "Open plots fetched successfully"));
});

export const getOpenPlotById = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError(400, "Open Plot ID (_id) is required");
  }

  const openPlot = await OpenPlot.findById(_id);

  if (!openPlot) {
    throw new ApiError(404, "Open Plot not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, openPlot, "Open plot fetched successfully"));
});

export const deleteOpenPlot = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError(400, "Open Plot ID (_id) is required");
  }

  const existingPlot = await OpenPlot.findById(_id);
  if (!existingPlot) {
    throw new ApiError(404, "Open Plot not found");
  }

  await OpenPlot.findByIdAndDelete(_id);

  return res
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
