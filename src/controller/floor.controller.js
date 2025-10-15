import mongoose from "mongoose";
import FloorUnit from "../modals/floorUnit.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createFloor = asyncHandler(async (req, res) => {
  const {
    buildingId,
    floorNumber,
    unitType,
    totalSubUnits,
    availableSubUnits,
    priceRange,
  } = req.body;

  if (
    [buildingId, unitType].some((field) => field === "") &&
    !floorNumber &&
    !totalSubUnits &&
    !availableSubUnits
  ) {
    throw new ApiError(400, "Required fields are missing");
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
    .status(200)
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
  const floor = req.body;
  if (!_id) throw new ApiError(400, `Floor ID not received properly: ${_id}`);

  const updatedFloor = await FloorUnit.findByIdAndUpdate(_id, floor, {
    new: true,
    runValidators: true,
  });

  if (!updatedFloor) throw new ApiError(404, "Floor not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedFloor, "Floor updated successfully"));
});

export const deleteFloorById = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) throw new ApiError(400, `Floor ID not received properly: ${_id}`);

  const deletedFloor = await FloorUnit.findByIdAndDelete(_id);

  if (!deletedFloor) throw new ApiError(404, "Floor not found.");

  return res
    .status(201)
    .json(new ApiResponse(200, deletedFloor, "Floor Deleted Successfully"));
});

export const getAllFloorsByBuildingIdForDropDown = asyncHandler(
  async (req, res) => {
    const { buildingId } = req.params;

    if (!buildingId) {
      throw new ApiError(
        400,
        `Building ID not received properly: ${buildingId}`
      );
    }

    const floors = await FloorUnit.find({
      buildingId: new mongoose.Types.ObjectId(buildingId),
    }).select("_id floorNumber unitType");

    const message = floors.length
      ? "Floors retrieved successfully"
      : "No floors added yet";

    return res.status(200).json(new ApiResponse(200, floors, message));
  }
);
