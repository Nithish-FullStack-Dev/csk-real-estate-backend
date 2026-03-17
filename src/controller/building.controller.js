// import { uploadPdfToCloudinary } from "../config/cloudinary.js";
import Building from "../modals/building.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
// import { uploadFile } from "../utils/uploadFile.js";
import Customer from "../modals/customerSchema.js";
import User from "../modals/user.js";
import { createNotification } from "../utils/notificationHelper.js";

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
    amenities,
  } = req.body;

  if (
    !projectName?.trim() ||
    !location?.trim() ||
    !propertyType?.trim() ||
    !totalUnits
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  const brochureLocalPath = req.files?.brochureUrl?.[0]?.path;
  const thumbnailFile = req.files?.thumbnailUrl?.[0];

  const thumbnailUrl = thumbnailFile
    ? `${req.protocol}://${req.get("host")}/api/uploads/images/${thumbnailFile.filename}`
    : "";
  if (!brochureLocalPath) throw new ApiError(400, "Brochure file is required");

  // const thumbnailUrl = await uploadFile(thumbnailLocalPath, "Thumbnail");

  const brochureFile = req.files?.brochureUrl?.[0];

  const brochureUrl = brochureFile
    ? `${req.protocol}://${req.get("host")}/api/uploads/pdfs/${brochureFile.filename}`
    : "";

  // const brochureUrl = await uploadPdfToCloudinary(brochureLocalPath);
  // if (!thumbnailUrl) {
  //   throw new ApiError(400, "thumbnailUrl file is required");
  // }
  if (!brochureUrl) {
    throw new ApiError(400, "brochureUrl file is required");
  }

  let imageUrls = [];

  if (req.files?.images && Array.isArray(req.files.images)) {
    imageUrls = req.files.images.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/api/uploads/images/${file.filename}`,
    );
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
    amenities,
    createdBy: req.user._id,
  });

  const createdBuilding = await Building.findById(building._id);
  if (!createdBuilding) {
    throw new ApiError(500, "Something went wrong while adding Building");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdBuilding, "Building Created Successfully"),
    );
});

export const getAllBuildings = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const role = req.user?.role;

  let matchCondition = {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  };

  if (role === "customer_purchased") {
    const purchases = await Customer.find({
      customerId: userId,
      isDeleted: false,
    }).select("property");

    const buildingIds = purchases.map((p) => p.property);

    matchCondition._id = { $in: buildingIds };
  }

  const buildings = await Building.aggregate([
    {
      $match: matchCondition,
    },
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
        amenities: 1,
      },
    },
  ]);

  if (!buildings.length) {
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
    .status(200)
    .json(new ApiResponse(200, building, "Building fetched successfully"));
});

export const updateBuilding = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const body = req.body;
  // console.log("test property update", body);

  if (!_id) {
    throw new ApiError(400, "Building ID (_id) is required");
  }

  const existingBuilding = await Building.findById(_id);
  if (!existingBuilding) {
    throw new ApiError(404, "Building not found");
  }

  let thumbnailUrl = existingBuilding.thumbnailUrl;
  let brochureUrl = existingBuilding.brochureUrl;
  let images = existingBuilding.images || [];

  const thumbnailLocalPath = req.files?.thumbnailUrl?.[0]?.path;
  const brochureLocalPath = req.files?.brochureUrl?.[0]?.path;

  /* ---------------- THUMBNAIL UPDATE ---------------- */
  if (req.files?.thumbnailUrl?.[0]) {
    thumbnailUrl = `${req.protocol}://${req.get("host")}/api/uploads/images/${req.files.thumbnailUrl[0].filename}`;
  }

  /* ---------------- BROCHURE REMOVE ---------------- */
  if (body.brochureRemoved === "true" || body.brochureRemoved === true) {
    brochureUrl = "";
  }

  /* ---------------- BROCHURE UPDATE ---------------- */
  if (req.files?.brochureUrl?.[0]) {
    brochureUrl = `${req.protocol}://${req.get("host")}/api/uploads/pdfs/${req.files.brochureUrl[0].filename}`;
  }

  /* ---------------- REMOVE SELECTED IMAGES ---------------- */
  if (body.removedImages) {
    const removed = Array.isArray(body.removedImages)
      ? body.removedImages
      : [body.removedImages];

    images = images.filter((img) => !removed.includes(img));
  }

  /* ---------------- REPLACE FULL GALLERY ---------------- */
  if (body.replaceGallery === "true") {
    images = [];
  }

  /* ---------------- UPLOAD NEW IMAGES ---------------- */
  if (req.files?.images && Array.isArray(req.files.images)) {
    const newImages = req.files.images.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/api/uploads/images/${file.filename}`,
    );

    images = [...images, ...newImages];
  }

  /* ---------------- FINAL UPDATE ---------------- */
  const updatedData = {
    ...body,
    thumbnailUrl,
    brochureUrl,
    images,
    updatedBy: req.user._id,
  };

  const updatedBuilding = await Building.findByIdAndUpdate(_id, updatedData, {
    new: true,
    runValidators: true,
  });

  /* =========================================================
   🔔 Notification: Construction Status Change
========================================================= */

  const oldStatus = existingBuilding.constructionStatus;
  const newStatus = body.constructionStatus;

  if (newStatus && newStatus !== oldStatus) {
    const receivers = await User.find({
      role: { $in: ["owner", "sales_manager", "agent"] },
    }).select("_id");

    const userIds = receivers.map((u) => u._id);
// console.log(userIds, "userdda");

    await createNotification({
      userId: userIds,
      title: "Construction Status Updated",
      message: `Construction status for ${updatedBuilding.projectName || updatedBuilding._id
        } changed to ${newStatus}.`,
      triggeredBy: req.user._id,
      category: "construction",
      priority: "P2",
      deepLink: `/properties/${updatedBuilding._id}`,
      entityType: "Building",
      entityId: updatedBuilding._id,
    });
  }

  /* =========================================================
     🔔 Notification: Documents Uploaded
  ========================================================= */

  const docsUploaded =
    req.files?.thumbnailUrl?.length ||
    req.files?.brochureUrl?.length ||
    req.files?.images?.length;

  if (docsUploaded) {
    const receivers = await User.find({
      role: { $in: ["owner", "agent"] },
    }).select("_id");

    const userIds = receivers.map((u) => u._id);

    await createNotification({
      userId: userIds,
      title: "New Property Documents Uploaded",
      message: `New documents were uploaded for ${updatedBuilding.projectName || updatedBuilding._id
        }.`,
      triggeredBy: req.user._id,
      category: "property",
      priority: "P3",
      deepLink: `/properties/${updatedBuilding._id}`,
      entityType: "Building",
      entityId: updatedBuilding._id,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedBuilding, "Building updated successfully"),
    );
});

export const deleteBuilding = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  const building = await Building.findById(_id);
  if (!building) throw new ApiError(404, "Building not found");

  await building.softDelete(req.user._id);

  return res.json(
    new ApiResponse(200, null, "Building moved to trash successfully"),
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
        "Upcoming properties fetched successfully",
      ),
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
        "Ongoing properties fetched successfully",
      ),
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
        "Completed properties fetched successfully",
      ),
    );
});

export const getTrashedBuildings = asyncHandler(async (req, res) => {
  const buildings = await Building.find({ isDeleted: true }, null, {
    withDeleted: true,
  });

  res.json(new ApiResponse(200, buildings));
});

export const restoreBuilding = asyncHandler(async (req, res) => {
  const building = await Building.findOne(
    { _id: req.params.id, isDeleted: true },
    null,
    { withDeleted: true },
  );

  if (!building) throw new ApiError(404, "Building not found in trash");

  await building.restore();

  res.json(new ApiResponse(200, null, "Building restored successfully"));
});

export const deleteBuildingPermanently = asyncHandler(async (req, res) => {
  const deletedBuilding = await Building.findOneAndDelete({
    _id: req.params._id,
    isDeleted: true,
  });

  if (!deletedBuilding) throw new ApiError(404, "Building not found in trash");

  res.json(new ApiResponse(200, null, "Building permanently deleted"));
});
