import Building from "../modals/building.model.js";
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
    reraApproved,
    reraNumber,
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

  let imageUrls = [];
  if (req.files?.images && Array.isArray(req.files.images)) {
    const imageUploadPromises = req.files.images.map(async (file) => {
      const uploadedUrl = await uploadFile(file.path, "Gallery");
      return uploadedUrl;
    });
    imageUrls = await Promise.all(imageUploadPromises);
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
    reraApproved,
    reraNumber,
    thumbnailUrl: thumbnailUrl || "",
    images: imageUrls,
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

export const getAllBuildings = asyncHandler(async (req, res) => {
  const buildings = await Building.aggregate([
    {
      $project: {
        _id: 1,
        projectName: 1,
        location: 1,
        propertyType: 1,
        totalUnits: 1,
        availableUnits: 1,
        soldUnits: 1,
        constructionStatus: 1,
        completionDate: 1,
        thumbnailUrl: 1,
        municipalPermission: 1,
        reraApproved: 1,
        reraNumber: 1,
        brochureUrl: 1,
        description: 1,
        images: 1,
      },
    },
  ]);

  if (!buildings || buildings.length === 0) {
    throw new ApiError(404, "No buildings found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, buildings, "Buildings fetched successfully"));
});

export const getBuildingById = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id)
    throw new ApiError(400, `Building ID not received properly: ${_id}`);

  const building = await Building.findById(_id);
  if (!building) throw new ApiError(404, "Building not found");

  return res
    .status(201)
    .json(new ApiResponse(200, building, "Building fetched successfully"));
});

export const updateBuilding = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const body = req.body;
  if (!_id) {
    throw new ApiError(400, "Building ID (_id) is required");
  }

  const existingBuilding = await Building.findById(_id);
  if (!existingBuilding) {
    throw new ApiError(404, "Building not found");
  }

  let thumbnailUrl = existingBuilding.thumbnailUrl;
  let brochureUrl = existingBuilding.brochureUrl;
  let images = existingBuilding.galleryImages || [];

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  const brochureLocalPath = getFilePath(req.files, "brochureUrl");

  if (thumbnailLocalPath) {
    const uploadedThumbnail = await uploadFile(thumbnailLocalPath, "Thumbnail");
    if (!uploadedThumbnail)
      throw new ApiError(500, "Failed to upload new thumbnail");
    thumbnailUrl = uploadedThumbnail;
  }

  if (brochureLocalPath) {
    const uploadedBrochure = await uploadFile(brochureLocalPath, "Brochure");
    if (!uploadedBrochure)
      throw new ApiError(500, "Failed to upload new brochure");
    brochureUrl = uploadedBrochure;
  }

  if (req.files?.images && Array.isArray(req.files.images)) {
    const newImages = await Promise.all(
      req.files.images.map(async (file) => {
        const uploadedUrl = await uploadFile(file.path, "Gallery");
        return uploadedUrl;
      })
    );
    images = [...existingBuilding?.images, ...newImages];
  }

  const updatedData = {
    ...body,
    thumbnailUrl,
    brochureUrl,
    images,
  };

  const updatedBuilding = await Building.findByIdAndUpdate(_id, updatedData, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedBuilding, "Building updated successfully")
    );
});

export const deleteBuilding = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const deletedBuilding = await Building.findByIdAndDelete(_id);

  if (!deletedBuilding) throw new ApiError(404, "Building not found.");

  return res
    .status(201)
    .json(
      new ApiResponse(200, deletedBuilding, "Building Deleted Successfully")
    );
});

export const getUpcomingBuilding = asyncHandler(async (req, res) => {
  const upcomingProperties = await Building.find({
    constructionStatus: "Planned",
  });

  if (!upcomingProperties) {
    throw new ApiError(404, "No upcoming properties found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        upcomingProperties,
        "Upcoming properties fetched successfully"
      )
    );
});

export const getOngoingBuilding = asyncHandler(async (req, res) => {
  const upcomingProperties = await Building.find({
    constructionStatus: "Under Construction",
  });

  if (!upcomingProperties) {
    throw new ApiError(404, "No Ongoing properties found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        upcomingProperties,
        "Ongoing properties fetched successfully"
      )
    );
});

export const getCompletedBuilding = asyncHandler(async (req, res) => {
  const upcomingProperties = await Building.find({
    constructionStatus: "Completed",
  });

  if (!upcomingProperties) {
    throw new ApiError(404, "No Completed properties found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        upcomingProperties,
        "Completed properties fetched successfully"
      )
    );
});
