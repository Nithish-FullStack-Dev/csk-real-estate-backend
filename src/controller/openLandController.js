// src/controller/openLandController.js

import mongoose from "mongoose";
import OpenLand from "../modals/openLand.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ------------------------------------------------------- */
/* POPULATE HELPER */
/* ------------------------------------------------------- */

const populateOpenLand = (query) =>
  query
    .populate("ownerCustomer", "name phone email")
    .populate(
      "interestedCustomers.lead",
      "name phone email status propertyStatus",
    )
    .populate("interestedCustomers.agent", "name email")
    .populate("soldToCustomer", "name phone email")
    .populate("agentId", "name email");

/* ------------------------------------------------------- */
/* CREATE */
/* ------------------------------------------------------- */

export const createOpenLand = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  data.projectName = data.projectName?.trim();
  data.location = data.location?.trim();
  data.surveyNumber = data.surveyNumber?.trim();

  if (!data.projectName || !data.location || !data.surveyNumber) {
    throw new ApiError(400, "Required fields missing");
  }

  const existingLand = await OpenLand.findOne({
    isDeleted: false,
    surveyNumber: data.surveyNumber,
    location: data.location,
  });

  if (existingLand) {
    throw new ApiError(
      409,
      "Land already exists for this survey number in this location",
    );
  }

  /* -------- FILE HANDLING -------- */

  let thumbnailUrl = null;
  let brochureUrl = null;

  if (req.files?.thumbnailUrl?.[0]) {
    thumbnailUrl = `${req.protocol}://${req.get("host")}/api/uploads/images/${req.files.thumbnailUrl[0].filename}`;
  }

  if (req.files?.brochureUrl?.[0]) {
    brochureUrl = `${req.protocol}://${req.get("host")}/api/uploads/pdfs/${req.files.brochureUrl[0].filename}`;
  }

  let imageUrls = [];

  if (req.files?.images && Array.isArray(req.files.images)) {
    imageUrls = req.files.images.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/api/uploads/images/${file.filename}`,
    );
  }

  const newLand = await OpenLand.create({
    ...data,
    thumbnailUrl,
    brochureUrl,
    images: imageUrls,
    createdBy: req.user._id,
  });

  const populated = await populateOpenLand(
    OpenLand.findOne({ _id: newLand._id, isDeleted: false }),
  ).exec();

  res
    .status(201)
    .json(new ApiResponse(201, populated, "Open land created successfully"));
});

/* ------------------------------------------------------- */
/* GET ALL */
/* ------------------------------------------------------- */

export const getAllOpenLand = asyncHandler(async (req, res) => {
  const lands = await populateOpenLand(
    OpenLand.find({ isDeleted: false }).sort({ createdAt: -1 }),
  ).exec();

  res.status(200).json(new ApiResponse(200, lands));
});

/* ------------------------------------------------------- */
/* GET ONE */
/* ------------------------------------------------------- */

export const getOpenLandById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid ID");
  }

  const land = await populateOpenLand(
    OpenLand.findOne({ _id: id, isDeleted: false }),
  ).exec();

  if (!land) throw new ApiError(404, "Open land not found");

  res.status(200).json(new ApiResponse(200, land));
});

/* ------------------------------------------------------- */
/* DELETE */
/* ------------------------------------------------------- */

export const deleteOpenLandById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid land ID");
  }

  const land = await OpenLand.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id },
    { new: true },
  );

  if (!land) throw new ApiError(404, "Open land not found");

  res
    .status(200)
    .json(new ApiResponse(200, null, "Open land deleted successfully"));
});

/* ------------------------------------------------------- */
/* UPDATE (PRODUCTION READY) */
/* ------------------------------------------------------- */

export const updateOpenLand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Open Land ID");
  }

  const existingLand = await OpenLand.findOne({ _id: id, isDeleted: false });
  if (!existingLand) throw new ApiError(404, "Open Land not found");

  const data = { ...req.body };

  let thumbnailUrl = existingLand.thumbnailUrl;
  let brochureUrl = existingLand.brochureUrl;
  let images = existingLand.images || [];

  if (req.files?.thumbnailUrl?.[0]) {
    thumbnailUrl = `${req.protocol}://${req.get("host")}/api/uploads/images/${req.files.thumbnailUrl[0].filename}`;
  }
  if (data.brochureRemoved === "true" || data.brochureRemoved === true) {
    brochureUrl = "";
  }
  if (req.files?.brochureUrl?.[0]) {
    brochureUrl = `${req.protocol}://${req.get("host")}/api/uploads/pdfs/${req.files.brochureUrl[0].filename}`;
  }
  if (data.removedImages) {
    const removed = Array.isArray(data.removedImages)
      ? data.removedImages
      : [data.removedImages];

    images = images.filter((img) => !removed.includes(img));
  }

  /* -------- ADD NEW IMAGES -------- */

  if (req.files?.images && Array.isArray(req.files.images)) {
    const newImages = req.files.images.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/api/uploads/images/${file.filename}`,
    );

    images = [...images, ...newImages];
  }

  const updatedLand = await OpenLand.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      ...data,
      thumbnailUrl,
      brochureUrl,
      images,
      updatedBy: req.user._id,
    },
    { new: true, runValidators: true },
  );

  const populated = await populateOpenLand(
    OpenLand.findOne({ _id: updatedLand._id, isDeleted: false }),
  ).exec();

  res
    .status(200)
    .json(new ApiResponse(200, populated, "Open land updated successfully"));
});
/* ------------------------------------------------------- */
/* INTERESTED CUSTOMERS */
/* ------------------------------------------------------- */

export const addInterestedCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { leadId, agentId } = req.body;

  if (!leadId || !agentId) {
    throw new ApiError(400, "leadId and agentId required");
  }

  const land = await OpenLand.findOne({ _id: id, isDeleted: false });
  if (!land) throw new ApiError(404, "Open land not found");

  const alreadyExists = land.interestedCustomers.some(
    (c) => c.lead.toString() === leadId,
  );

  if (alreadyExists) {
    throw new ApiError(400, "Lead already marked as interested");
  }

  land.interestedCustomers.push({
    lead: leadId,
    agent: agentId,
    createdAt: new Date(),
  });

  await land.save();

  const populated = await populateOpenLand(
    OpenLand.findOne({ _id: id, isDeleted: false }),
  ).exec();

  res.status(200).json(new ApiResponse(200, populated));
});

export const updateInterestedCustomer = asyncHandler(async (req, res) => {
  const { id, interestId } = req.params;
  const { leadId, agentId } = req.body;

  const land = await OpenLand.findOne({ _id: id, isDeleted: false });
  if (!land) throw new ApiError(404, "Land not found");

  const entry = land.interestedCustomers.id(interestId);
  if (!entry) throw new ApiError(404, "Interested entry not found");

  entry.lead = leadId;
  entry.agent = agentId;
  entry.updatedAt = new Date();

  await land.save();

  const populated = await populateOpenLand(
    OpenLand.findOne({ _id: id, isDeleted: false }),
  ).exec();

  res.status(200).json(new ApiResponse(200, populated));
});

export const removeInterestedCustomer = asyncHandler(async (req, res) => {
  const { id, interestId } = req.params;

  await OpenLand.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $pull: { interestedCustomers: { _id: interestId } },
    },
    { new: true },
  );

  const populated = await populateOpenLand(
    OpenLand.findOne({ _id: id, isDeleted: false }),
  ).exec();

  res.status(200).json(new ApiResponse(200, populated));
});

/* ------------------------------------------------------- */
/* SOLD */
/* ------------------------------------------------------- */

export const markAsSold = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { soldToCustomerId, soldDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Open Land ID");
  }

  if (!soldToCustomerId) {
    throw new ApiError(400, "Buyer required");
  }

  const land = await OpenLand.findOne({ _id: id, isDeleted: false });
  if (!land) throw new ApiError(404, "Open land not found");
  if (land.landStatus === "Sold") {
    throw new ApiError(400, "Land is already sold");
  }

  land.landStatus = "Sold";
  land.soldToCustomer = soldToCustomerId;
  land.soldDate = soldDate ? new Date(soldDate) : new Date();

  await land.save();

  const populated = await populateOpenLand(
    OpenLand.findOne({ _id: id, isDeleted: false }),
  ).exec();

  res.status(200).json(new ApiResponse(200, populated));
});

/* ------------------------------------------------------- */
/* DROPDOWN */
/* ------------------------------------------------------- */

export const getOpenLandDropdown = asyncHandler(async (req, res) => {
  const openLands = await OpenLand.find({ isDeleted: false }).select(
    "_id projectName",
  );

  res
    .status(200)
    .json(new ApiResponse(200, openLands, "Open Land dropdown fetched"));
});
