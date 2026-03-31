import mongoose from "mongoose";
import FloorUnit from "../modals/floorUnit.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Customer from "../modals/customerSchema.js";
import propertyUnitModel from "../modals/propertyUnit.model.js";
import { AuditLog } from "../modals/auditLog.model.js";
import Project from "../modals/projects.js";
import SiteInspection from "../modals/siteInspection.js";
import UserSchedule from "../modals/userSchedule.js";
import Invoice from "../modals/invoice.js";
import Lead from "../modals/leadModal.js";

export const createFloor = asyncHandler(async (req, res) => {
  const {
    buildingId,
    floorNumber,
    unitType,
    totalSubUnits,
    availableSubUnits,
    priceRange,
  } = req.body;

  if (!buildingId || floorNumber === undefined || !unitType) {
    throw new ApiError(400, "Required fields are missing");
  }

  /* 🔐 DUPLICATE FLOOR CHECK */
  const existingFloor = await FloorUnit.findOne({
    buildingId,
    floorNumber,
    isDeleted: false,
  });

  if (existingFloor) {
    throw new ApiError(
      409,
      `Floor ${floorNumber} already exists for this building`,
    );
  }

  const floor = await FloorUnit.create({
    buildingId,
    floorNumber,
    unitType,
    totalSubUnits,
    availableSubUnits,
    priceRange,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, floor, "Floor unit created successfully"));
});

export const getAllFloorsByBuildingId = asyncHandler(async (req, res) => {
  const { buildingId } = req.params;

  if (!buildingId) {
    throw new ApiError(400, `Building ID not received properly: ${buildingId}`);
  }

  const role = req.user?.role;
  const userId = req.user?._id;

  let query = {
    buildingId: new mongoose.Types.ObjectId(buildingId),
    isDeleted: false,
  };

  if (role === "customer_purchased") {
    const purchases = await Customer.find({
      customerId: userId,
      property: buildingId,
      isDeleted: false,
    }).select("floorUnit");

    const floorIds = [
      ...new Set(purchases.map((p) => p.floorUnit?.toString()).filter(Boolean)),
    ];

    query._id = { $in: floorIds };
  }

  const floors = await FloorUnit.find(query).sort({ floorNumber: 1 });

  const message = floors.length
    ? "Floors retrieved successfully"
    : "No floors available";

  return res.status(200).json(new ApiResponse(200, floors, message));
});

export const updateFloorById = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const data = req.body;

  if (!_id) throw new ApiError(400, "Floor ID missing");

  const floor = await FloorUnit.findOne({ _id, isDeleted: false });
  if (!floor) throw new ApiError(404, "Floor not found");

  /* 🔐 CHECK DUPLICATE BEFORE UPDATE */
  if (data.floorNumber !== undefined) {
    const duplicate = await FloorUnit.findOne({
      buildingId: floor.buildingId,
      floorNumber: data.floorNumber,
      _id: { $ne: _id },
      isDeleted: false,
    });

    if (duplicate) {
      throw new ApiError(
        409,
        `Floor ${data.floorNumber} already exists for this building`,
      );
    }
  }

  const updatedFloor = await FloorUnit.findOneAndUpdate(
    { _id, isDeleted: false },
    { ...data, updatedBy: req.user._id },
    {
      new: true,
      runValidators: true,
    },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedFloor, "Floor updated successfully"));
});

export const deleteFloorById = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new ApiError(400, "Invalid floor ID");
  }

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // ✅ 1. Check floor
    const floor = await FloorUnit.findById(_id).session(session);

    if (!floor) {
      throw new ApiError(404, "Floor not found");
    }

    // ✅ 2. Get all units under this floor
    const units = await propertyUnitModel
      .find({ floorId: _id })
      .select("_id")
      .lean()
      .session(session);

    const unitIds = units.map((u) => u._id);

    // ✅ 3. Delete all related data using UNIT (strong relation)
    if (unitIds.length > 0) {
      await Project.deleteMany({ unit: { $in: unitIds } }).session(session);

      await SiteInspection.deleteMany({ unit: { $in: unitIds } }).session(
        session,
      );

      await UserSchedule.deleteMany({ unit: { $in: unitIds } }).session(
        session,
      );

      await Customer.deleteMany({ unit: { $in: unitIds } }).session(session);

      await Invoice.deleteMany({ unit: { $in: unitIds } }).session(session);

      await Lead.deleteMany({ unit: { $in: unitIds } }).session(session);
    }

    // ✅ 4. Delete units
    await propertyUnitModel.deleteMany({ floorId: _id }).session(session);

    // ✅ 5. Delete floor
    await FloorUnit.findByIdAndDelete(_id).session(session);

    // ✅ 6. Audit log
    await AuditLog.create(
      [
        {
          operationType: "delete",
          database: "CSKestate",
          collectionName: "floorunits",
          documentId: floor._id,
          fullDocument: floor,
          previousFields: floor,
          changeEventId: new mongoose.Types.ObjectId().toString(),
          userId: req.user?._id || null,
        },
      ],
      { session },
    );

    // ✅ 7. Commit transaction
    await session.commitTransaction();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Floor deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const getAllFloorsByBuildingIdForDropDown = asyncHandler(
  async (req, res) => {
    const { buildingId } = req.params;

    if (!buildingId) {
      throw new ApiError(
        400,
        `Building ID not received properly: ${buildingId}`,
      );
    }

    const floors = await FloorUnit.find({
      buildingId: new mongoose.Types.ObjectId(buildingId),
      isDeleted: false,
    })
      .sort({ floorNumber: 1 })
      .select("_id floorNumber unitType");
    const message = floors.length
      ? "Floors retrieved successfully"
      : "No floors added yet";

    return res.status(200).json(new ApiResponse(200, floors, message));
  },
);
