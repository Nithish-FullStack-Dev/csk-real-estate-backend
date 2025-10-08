import { uploadOnCloudniary } from "../config/cloudinary.js";
import Building from "../modals/building.model.js";
import FloorUnit from "../modals/floorUnit.model.js";
import PropertyUnit from "../modals/propertyUnit.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";

export const createBuilding = asyncHandler(async (req, res) => {
  const {
    projectName,
    location,
    propertyType,
    totalUnits,
    availableUnits,
    soldUnits,
    constructionStatus,
    completionDate,
    description,
    municipalPermission,
    googleMapsLocation,
  } = req.body;

  if (
    [projectName, location, propertyType].some(
      (field) => field?.trim() === ""
    ) &&
    !totalUnits
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  const brochureLocalPath = getFilePath(req.files, "brochureUrl");

  if (!thumbnailLocalPath)
    throw new ApiError(400, "Thumbnail file is required");
  if (!brochureLocalPath) throw new ApiError(400, "Brochure file is required");

  const thumbnailUrl = await uploadFile(thumbnailLocalPath, "Thumbnail");
  const brochureUrl = await uploadFile(brochureLocalPath, "Brochure");

  if (!thumbnailUrl) {
    throw new ApiError(400, "thumbnailUrl file is required");
  }
  if (!brochureUrl) {
    throw new ApiError(400, "brochureUrl file is required");
  }

  const building = await Building.create({
    projectName,
    location,
    propertyType,
    totalUnits,
    availableUnits,
    soldUnits,
    constructionStatus,
    completionDate,
    description,
    municipalPermission,
    thumbnailUrl: thumbnailUrl || "",
    // priceRange,
    googleMapsLocation,
    brochureUrl: brochureUrl || "",
  });

  const createdBuilding = await Building.findById(building._id);
  if (!createdBuilding) {
    throw new ApiError(500, "Something went wrong while adding Building");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdBuilding, "Building Created Successfully")
    );
});
