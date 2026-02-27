// import PropertyUnitModel from "../modals/propertyUnit.model.js";
import PropertyUnitModel from "../modals/propertyUnit.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import Customer from "../modals/customerSchema.js";

export const createUnit = asyncHandler(async (req, res) => {
  const { buildingId, floorId, plotNo } = req.body;

  if (!buildingId || !floorId) {
    throw new ApiError(400, "buildingId and floorId are required");
  }

  const isBulk = req.body.bulk === "true";

  /* 🔐 BULK DUPLICATE CHECK */
  if (isBulk && req.body.units?.length) {
    const incomingPlotNos = req.body.units.map((u) => u.plotNo);

    const existingUnits = await PropertyUnitModel.find({
      buildingId,
      floorId,
      plotNo: { $in: incomingPlotNos },
    });

    if (existingUnits.length > 0) {
      const duplicates = existingUnits.map((u) => u.plotNo).join(", ");

      throw new ApiError(
        409,
        `These units already exist on this floor: ${duplicates}`,
      );
    }
  }

  /* 🔐 SINGLE DUPLICATE CHECK */
  if (!isBulk && plotNo) {
    const existingUnit = await PropertyUnitModel.findOne({
      buildingId,
      floorId,
      plotNo,
    });

    if (existingUnit) {
      throw new ApiError(409, `Unit ${plotNo} already exists on this floor`);
    }
  }

  /* ---------- FILE HANDLING ---------- */

  let thumbnailUrl = null;

  if (!isBulk) {
    const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");

    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is required");
    }

    thumbnailUrl = await uploadFile(thumbnailLocalPath, "ThumbnailUrl");
  }

  if (isBulk) {
    const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
    if (thumbnailLocalPath) {
      thumbnailUrl = await uploadFile(thumbnailLocalPath, "ThumbnailUrl");
    }
  }

  let imageUrls = [];
  if (req.files?.images && Array.isArray(req.files.images)) {
    imageUrls = await Promise.all(
      req.files.images.map((file) => uploadFile(file.path, "Gallery")),
    );
  }

  const documents = [];
  const documentFiles = req.files?.documents || [];

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

  /* ---------- CREATE ---------- */

  let unit;

  try {
    unit = await PropertyUnitModel.create({
      ...req.body,
      thumbnailUrl,
      documents,
      images: imageUrls,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Unit already exists on this floor");
    }

    throw error;
  }

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

  // ✅ Destructure and explicitly extract IDs — don't let them pass through as-is
  const { buildingId, floorId, plotNo, visibility, ...rest } = req.body;

  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    throw new ApiError(400, "Invalid unit ID");
  }

  const unit = await PropertyUnitModel.findById(unitId);
  if (!unit) {
    throw new ApiError(404, "Unit not found");
  }

  /* 🔐 DUPLICATE CHECK BEFORE UPDATE */
  if (plotNo) {
    const duplicate = await PropertyUnitModel.findOne({
      buildingId: buildingId || unit.buildingId,
      floorId: floorId || unit.floorId,
      plotNo,
      _id: { $ne: unitId },
    });

    if (duplicate) {
      throw new ApiError(409, `Unit ${plotNo} already exists on this floor`);
    }
  }

  let thumbnailUrl = unit.thumbnailUrl;
  let images = unit.images || [];

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
        visibility: visibility || "PURCHASER_ONLY",
        createdAt: new Date(),
      });
    }
    documents = [...documents, ...newDocs];
  }
  if (req.body.removedImages) {
    const removed = Array.isArray(req.body.removedImages)
      ? req.body.removedImages
      : [req.body.removedImages];

    images = images.filter((img) => !removed.includes(img));
  }
  if (req.files?.images && Array.isArray(req.files.images)) {
    const newImages = await Promise.all(
      req.files.images.map((file) => uploadFile(file.path, "Gallery")),
    );

    images = [...images, ...newImages];
  }

  const updatedData = {
    ...rest,
    thumbnailUrl,
    documents,
    images,
    // ✅ Only include buildingId/floorId if they are valid ObjectId strings
    ...(buildingId &&
      mongoose.Types.ObjectId.isValid(buildingId) && { buildingId }),
    ...(floorId && mongoose.Types.ObjectId.isValid(floorId) && { floorId }),
    ...(plotNo && { plotNo }),
  };

  const updatedUnit = await PropertyUnitModel.findByIdAndUpdate(
    unitId,
    { $set: updatedData },
    { new: true, runValidators: true },
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

  if (unit.projectStatus !== "completed") {
    throw new ApiError(
      400,
      "Unit can be deleted only after the project is completed",
    );
  }

  await PropertyUnitModel.findByIdAndDelete(unitId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Unit deleted successfully because the project is completed",
      ),
    );
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
  },
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
  },
);

export const getPurchasedCustomerUnits = asyncHandler(async (req, res) => {
  const { unitId } = req.params;

  if (!unitId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Unit ID is required"));
  }

  const customers = await Customer.aggregate([
    {
      $match: {
        unit: new mongoose.Types.ObjectId(unitId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "customerId",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    { $unwind: "$customerDetails" },
    {
      $project: {
        _id: 0,
        name: "$customerDetails.name",
        email: "$customerDetails.email",
        bookingDate: "$bookingDate",
        finalPrice: "$finalPrice",
        paymentStatus: "$paymentStatus",
        paymentPlan: "$paymentPlan",
      },
    },
  ]);

  if (customers.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No customer found for this unit"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, customers, "Customers retrieved successfully"));
});
