import mongoose from "mongoose";
import UserSchedule from "../modals/userSchedule.js";
import User from "../modals/user.js";
import Building from "../modals/building.model.js";
import FloorUnit from "../modals/floorUnit.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// ✅ CREATE Schedule
export const createUserSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      type,
      clientId,
      property,
      floorUnit,
      unit,
      date,
      startTime,
      endTime,
      location,
      notes,
      status,
    } = req.body;

    // Validation
    if (
      !userId ||
      !title ||
      !type ||
      !clientId ||
      !property ||
      !floorUnit ||
      !unit ||
      !date ||
      !startTime ||
      !endTime ||
      !location
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });
    }

    // Check client existence
    const clientExists = await User.findById(clientId);
    if (!clientExists) {
      return res.status(404).json({ error: "Client not found" });
    }

    const schedule = new UserSchedule({
      user: userId,
      title,
      type,
      client: clientId, // ✅ simplified
      property,
      floorUnit,
      unit,
      date,
      startTime,
      endTime,
      location,
      notes,
      status: status || "pending",
    });

    const saved = await schedule.save();

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: saved,
    });
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUserSchedules = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const schedules = await UserSchedule.find({ user: userId })
      .sort({ startTime: 1 })
      .select("-__v")
      .populate("client", "name avatar")
      .populate("property", "_id projectName location propertyType")
      .populate("floorUnit", "_id floorNumber unitType")
      .populate("unit", "_id plotNo propertyType status");

    res
      .status(200)
      .json(new ApiResponse(200, schedules, "Schedules fetched successfully"));
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ error: "Server error while fetching schedules" });
  }
};

// ✅ UPDATE Schedule
export const updateSchedule = asyncHandler(async (req, res) => {
  const scheduleId = req.params.id;
  const {
    title,
    type,
    client,
    property,
    floorUnit,
    unit,
    date,
    startTime,
    endTime,
    location,
    notes,
    status,
  } = req.body;

  if (
    !scheduleId ||
    !title ||
    !type ||
    !client ||
    !property ||
    !floorUnit ||
    !unit ||
    !date ||
    !startTime ||
    !endTime ||
    !location
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Missing or invalid required fields."));
  }

  const updateData = {
    title,
    type,
    client,
    property,
    floorUnit,
    unit,
    date,
    startTime,
    endTime,
    location,
    notes,
    status,
  };

  const updatedSchedule = await UserSchedule.findByIdAndUpdate(
    scheduleId,
    updateData,
    { new: true }
  );

  if (!updatedSchedule) {
    return res.status(404).json({ error: "Schedule not found." });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedSchedule, "Schedule updated successfully")
    );
});

export const getBuildingNameForDropDown = asyncHandler(async (req, res) => {
  const buildings = await Building.find().select("_id projectName");
  if (!buildings || buildings.length === 0) {
    throw new ApiError(404, "No buildings found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, buildings, "Buildings fetched successfully"));
});

export const getUnitsNameForDropDown = asyncHandler(async (req, res) => {
  const units = await FloorUnit.find().select(
    "_id buildingId floorNumber unitType"
  );

  const message = units.length
    ? "Units fetched successfully"
    : "No units found for this building";

  return res.status(200).json(new ApiResponse(200, units, message));
});
