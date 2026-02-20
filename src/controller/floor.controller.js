import mongoose from "mongoose";
import FloorUnit from "../modals/floorUnit.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import propertyUnitModel from "../modals/propertyUnit.model.js";

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

  const floors = await FloorUnit.find({
    buildingId: new mongoose.Types.ObjectId(buildingId),
  });

  // if (!floors || floors.length === 0) {
  //   throw new ApiError(404, "Floors not found");
  // }

  const message = floors.length
    ? "Floors retrieved successfully"
    : "No floors added yet";

  return res.status(200).json(new ApiResponse(200, floors, message));
});

export const updateFloorById = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const data = req.body;

  if (!_id) throw new ApiError(400, "Floor ID missing");

  const floor = await FloorUnit.findById(_id);
  if (!floor) throw new ApiError(404, "Floor not found");

  /* 🔐 CHECK DUPLICATE BEFORE UPDATE */
  if (data.floorNumber !== undefined) {
    const duplicate = await FloorUnit.findOne({
      buildingId: floor.buildingId,
      floorNumber: data.floorNumber,
      _id: { $ne: _id },
    });

    if (duplicate) {
      throw new ApiError(
        409,
        `Floor ${data.floorNumber} already exists for this building`,
      );
    }
  }

  const updatedFloor = await FloorUnit.findByIdAndUpdate(_id, data, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedFloor, "Floor updated successfully"));
});

export const deleteFloorById = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid floor ID"));
  }

  const floor = await FloorUnit.findById(_id);

  if (!floor) {
    return res.status(404).json(new ApiResponse(404, null, "Floor not found"));
  }

  const pendingUnitsCount = await propertyUnitModel.countDocuments({
    floorId: _id,
    projectStatus: { $ne: "completed" },
  });

  if (pendingUnitsCount > 0) {
    throw new ApiError(
      409,
      "Floor can be deleted only after all units in this floor are completed status",
    );
  }

  await FloorUnit.findByIdAndDelete(_id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Floor deleted successfully"));
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
    }).select("_id floorNumber unitType");

    const message = floors.length
      ? "Floors retrieved successfully"
      : "No floors added yet";

    return res.status(200).json(new ApiResponse(200, floors, message));
  },
);
