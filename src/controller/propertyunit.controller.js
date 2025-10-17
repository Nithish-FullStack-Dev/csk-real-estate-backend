// import PropertyUnitModel from "../modals/propertyUnit.model.js";
import PropertyUnitModel from "../modals/propertyUnit.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const createUnit = asyncHandler(async (req, res) => {
  const { buildingId, floorId } = req.body;

  if (!buildingId || !floorId) {
    throw new ApiError(400, "buildingId and floorId are required");
  }

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const thumbnailUrl = await uploadFile(thumbnailLocalPath, "ThumbnailUrl");

  const documentFiles = req.files?.documents || [];
  const documents = [];

  for (const file of documentFiles) {
    const fileUrl = await uploadFile(file.path, "Document");
    documents.push({
      title: file.originalname,
      fileUrl,
      mimeType: file.mimetype,
      visibility: req.body.visibility || "PURCHASER_ONLY",
      createdAt: new Date(),
    });
  }

  const unit = await PropertyUnitModel.create({
    ...req.body,
    thumbnailUrl,
    documents,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, unit, "Unit Created Successfully"));
});

export const getUnitsByFloorIdAndBuildingId = asyncHandler(async (req, res) => {
  const { buildingId, floorId } = req.params;

  if (!buildingId || !floorId) {
    throw new ApiError(400, "Building ID or Floor ID missing");
  }

  const units = await PropertyUnitModel.find({
    buildingId: new mongoose.Types.ObjectId(buildingId),
    floorId: new mongoose.Types.ObjectId(floorId),
  })
    .populate("buildingId", "projectName location propertyType")
    .populate("floorId", "floorNumber unitType totalSubUnits")
    .exec();

  // if (!units || units.length === 0) {
  //   throw new ApiError(404, "No units found for the given floor and building");
  // }
  const message = units.length
    ? "Units retrieved successfully"
    : "No Units added yet";

  res.status(200).json(new ApiResponse(200, units, message));
});

export const updateUnit = asyncHandler(async (req, res) => {
  const { unitId } = req.params;
  const { buildingId, floorId, ...rest } = req.body;

  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw new ApiError(400, "Invalid unit ID");
  }

  const unit = await PropertyUnitModel.findById(unitId);
  if (!unit) {
    throw new ApiError(404, "Unit not found");
  }

  let thumbnailUrl = unit.thumbnailUrl;

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  if (thumbnailLocalPath) {
    const uploadedThumbnail = await uploadFile(thumbnailLocalPath, "Thumbnail");
    if (!uploadedThumbnail)
      throw new ApiError(500, "Failed to upload new thumbnail");
    thumbnailUrl = uploadedThumbnail;
  }

  let documents = [...(unit.documents || [])];
  const documentFiles = req.files?.documents || [];

  if (documentFiles.length > 0) {
    const newDocs = [];
    for (const file of documentFiles) {
      const fileUrl = await uploadFile(file.path, "Document");
      newDocs.push({
        title: file.originalname,
        fileUrl,
        mimeType: file.mimetype,
        visibility: req.body.visibility || "PURCHASER_ONLY",
        createdAt: new Date(),
      });
    }
    documents = [...documents, ...newDocs];
  }

  const updatedData = {
    ...rest,
    thumbnailUrl,
    documents,
  };

  const updatedUnit = await PropertyUnitModel.findByIdAndUpdate(
    unitId,
    { $set: updatedData },
    { new: true, runValidators: true }
  )
    .populate("buildingId", "projectName location propertyType")
    .populate("floorId", "floorNumber unitType totalSubUnits")
    .exec();

  if (!updatedUnit) {
    throw new ApiError(500, "Failed to update unit");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUnit, "Unit updated successfully"));
});

export const deleteUnit = asyncHandler(async (req, res) => {
  const { unitId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw new ApiError(400, "Invalid unit ID");
  }

  const unit = await PropertyUnitModel.findById(unitId);
  if (!unit) {
    throw new ApiError(404, "Unit not found");
  }

  // Optionally, delete associated files from cloud storage
  // This requires integration with your file storage service (e.g., Cloudinary)
  // Example: await deleteFile(unit.thumbnailUrl);

  await PropertyUnitModel.findByIdAndDelete(unitId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Unit deleted successfully"));
});

export const getUnit = asyncHandler(async (req, res) => {
  const { unitId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw new ApiError(400, "Invalid unit ID");
  }

  const unit = await PropertyUnitModel.findById(unitId)
    .populate("buildingId", "projectName location propertyType")
    .populate("floorId", "floorNumber unitType totalSubUnits")
    .populate("customerId", "user.name user.email")
    .populate("contractor", "name")
    .populate("siteIncharge", "name")
    .populate("agentId", "name")
    .exec();

  if (!unit) {
    throw new ApiError(404, "Unit not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, unit, "Unit retrieved successfully"));
});

export const getUnitsByFloorIdAndBuildingIdForDropDown = asyncHandler(
  async (req, res) => {
    const { buildingId, floorId } = req.params;

    if (!buildingId || !floorId) {
      throw new ApiError(400, "Building ID or Floor ID missing");
    }

    const units = await PropertyUnitModel.find({
      buildingId: new mongoose.Types.ObjectId(buildingId),
      floorId: new mongoose.Types.ObjectId(floorId),
    }).select("plotNo propertyType");

    const message = units.length
      ? "Units retrieved successfully"
      : "No Units added yet";

    res.status(200).json(new ApiResponse(200, units, message));
  }
);

export const getAvailableUnitsByFloorIdAndBuildingIdForDropDown = asyncHandler(
  async (req, res) => {
    const { buildingId, floorId } = req.params;
    if (!buildingId || !floorId) {
      throw new ApiError(400, "Building ID or Floor ID missing");
    }

    const units = await PropertyUnitModel.find({
      buildingId: new mongoose.Types.ObjectId(buildingId),
      floorId: new mongoose.Types.ObjectId(floorId),
      status: { $in: ["Available", "Under Construction"] },
    }).select("_id plotNo propertyType status");

    const message = units.length
      ? "Units retrieved successfully"
      : "No Units added yet";

    res.status(200).json(new ApiResponse(200, units, message));
  }
);
