import ScheduleVisit from "../modals/ScheduleVisit.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";

export const createScheduleVisit = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    preferredDate,
    time,
    visitors,
    requirements,
    propertyType,
    propertyId,
  } = req.body;

  let propertyPayload = {};

  if (propertyType === "building") {
    propertyPayload.building = propertyId;
  } else if (propertyType === "plot") {
    propertyPayload.plot = propertyId;
  } else if (propertyType === "land") {
    propertyPayload.land = propertyId;
  }

  const visit = await ScheduleVisit.create({
    name,
    phone,
    email,
    preferredDate: preferredDate ? new Date(preferredDate) : null,
    timeSlot: time,
    visitors: Number(visitors),
    requirements,
    propertyType,
    ...propertyPayload,
    status: "requested",
    createdBy: req.user?._id || null,
  });

  res
    .status(201)
    .json(new ApiResponse(201, visit, "Schedule visit created successfully"));
});

export const getAllScheduleVisits = asyncHandler(async (req, res) => {
  const visits = await ScheduleVisit.find()
    .populate("building", "projectName location")
    .populate("plot", "projectName location")
    .populate("land", "projectName location")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(200, visits, "Schedule visits retrieved successfully"),
    );
});

export const updateScheduleVisitStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid schedule visit ID");
  }

  const validStatuses = [
    "requested",
    "confirmed",
    "scheduled",
    "completed",
    "cancelled",
    "no_show",
  ];

  if (!status || !validStatuses.includes(status))
    throw new ApiError(400, "Invalid status value");

  const visits = await ScheduleVisit.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );

  if (!visits) {
    throw new ApiError(404, "Schedule visit not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        visits,
        "Schedule visit status updated successfully",
      ),
    );
});
