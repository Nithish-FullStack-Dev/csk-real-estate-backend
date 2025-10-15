import UserSchedule from "../modals/userSchedule.js"; // Adjust path as needed
import User from "../modals/user.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import Building from "../modals/building.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import FloorUnit from "../modals/floorUnit.model.js";

export const createUserSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      type,
      clientId,
      property,
      startTime,
      endTime,
      location,
      notes,
      date,
      status,
      unit,
    } = req.body;

    if (
      !userId ||
      !title ||
      !mongoose.Types.ObjectId.isValid(clientId) ||
      !property ||
      !mongoose.Types.ObjectId.isValid(property) ||
      !startTime ||
      !endTime ||
      !location ||
      !date
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });
    }

    const client = await User.findById(clientId).select("name avatar");

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const schedule = new UserSchedule({
      user: userId,
      title,
      type,
      client: {
        _id: client._id,
        name: client.name,
        avatar:
          client.avatar ||
          "https://cdn-icons-png.flaticon.com/512/847/847969.png", // fallback
      },
      property,
      startTime,
      endTime,
      location,
      notes,
      date,
      status: status || "pending",
      unit,
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
      return res.status(400).json({ error: "User ID is required in params." });
    }

    const schedules = await UserSchedule.find({ user: userId })
      .sort({ startTime: 1 })
      .select("-__v")
      .populate({
        path: "property",
        model: "Building",
        select: "projectName location propertyType",
      })
      .populate({
        path: "unit",
        model: "FloorUnit",
        select: "floorNumber unitType totalSubUnits availableSubUnits",
      });
    res.status(200).json({ schedules });
  } catch (error) {
    console.error("Error fetching user schedules:", error);
    res.status(500).json({ error: "Server error while fetching schedules" });
  }
};

export const getBuildingNameForDropDown = asyncHandler(async (req, res) => {
  const buildings = await Building.aggregate([
    {
      $project: {
        _id: 1,
        projectName: 1,
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

export const getUnitsNameForDropDown = asyncHandler(async (req, res) => {
  const units = await FloorUnit.find().select(
    "_id buildingId floorNumber unitType"
  );

  const message = units.length
    ? "units fetched successfully"
    : "No units found for this building";

  return res.status(200).json(new ApiResponse(200, units, message));
});

export const updateSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const {
      title,
      type,
      client,
      property,
      unit,
      startTime,
      endTime,
      location,
      notes,
      date,
      status,
    } = req.body;

    // Validation
    if (
      !scheduleId ||
      !title ||
      !type ||
      !client?._id ||
      !property?._id ||
      !unit?._id ||
      !startTime ||
      !endTime ||
      !location ||
      !date
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });
    }

    // Prepare update data
    const updateData = {
      title,
      type,
      client: {
        _id: client._id,
        name: client.name,
        avatar:
          client.avatar ||
          "https://cdn-icons-png.flaticon.com/512/847/847969.png", // fallback avatar
      },
      property: property._id,
      unit: unit._id,
      startTime,
      endTime,
      location,
      notes,
      date,
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

    res.json({
      message: "Schedule updated successfully",
      updatedSchedule,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
