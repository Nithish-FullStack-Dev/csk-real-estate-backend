import FloorUnit from "../modals/floorUnit.model.js";
import Building from "../modals/building.model.js";
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
    // priceRange
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
  });
  return res
    .status(200)
    .json(new ApiResponse(201, floor, "Floor unit created successfully"));
});
