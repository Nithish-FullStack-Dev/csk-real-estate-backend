// import PropertyUnitModel from "../modals/propertyUnit.model.js";
import PropertyUnitModel from "../modals/propertyUnit.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createUnit = asyncHandler(async (req, res) => {
  const { buildingId, floorId } = req.body;

  if (!buildingId || !floorId) {
    throw new ApiError(400, "buildingId and floorId are required");
  }

  const thumbnailUrlPath = getFilePath(req.files, "thumbnailUrl");
  if (!thumbnailUrlPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const thumbnailUrl = uploadFile(thumbnailUrlPath, "Thumbnail");

  if (!thumbnailUrl) {
    throw new ApiError(400, "ThumbnailUrl file is required");
  }

  const unit = await PropertyUnitModel.create({
    ...req.body,
    thumbnailUrl,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, unit, "Unit Created Successfully"));
});
