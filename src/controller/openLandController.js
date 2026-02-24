// src/controller/openLandController.js

import mongoose from "mongoose";
import OpenLand from "../modals/openLand.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";
import { uploadPdfToCloudinary } from "../config/cloudinary.js";

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
    surveyNumber: data.surveyNumber,
    location: data.location,
  });

  if (existingLand) {
    throw new ApiError(
      409,
      "Land already exists for this survey number in this location",
    );
  }

  /* ❌ REMOVE frontend cloudinary objects */
  delete data.images;
  delete data.thumbnailUrl;
  delete data.brochureUrl;

  /* FILE PATHS */
  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  const brochureLocalPath = getFilePath(req.files, "brochureUrl");

  let thumbnailUrl = null;
  let brochureUrl = null;

  if (thumbnailLocalPath) {
    thumbnailUrl = await uploadFile(thumbnailLocalPath, "OpenLand/Thumbnail");
  }

  if (brochureLocalPath) {
    brochureUrl = await uploadPdfToCloudinary(brochureLocalPath);
  }

  /* GALLERY IMAGES */
  let imageUrls = [];
  if (req.files?.images) {
    imageUrls = await Promise.all(
      req.files.images.map((file) => uploadFile(file.path, "OpenLand/Gallery")),
    );
  }

  const newLand = await OpenLand.create({
    ...data,
    thumbnailUrl,
    brochureUrl,
    images: imageUrls,
  });

  const populated = await populateOpenLand(
    OpenLand.findById(newLand._id),
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
    OpenLand.find().sort({ createdAt: -1 }),
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

  const land = await populateOpenLand(OpenLand.findById(id)).exec();

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

  const land = await OpenLand.findByIdAndDelete(id);

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

  const existingLand = await OpenLand.findById(id);
  if (!existingLand) throw new ApiError(404, "Open Land not found");

  const data = { ...req.body };

  /* ❌ remove frontend cloudinary objects */
  delete data.images;
  delete data.thumbnailUrl;
  delete data.brochureUrl;

  /* ---------------- FILE PATHS ---------------- */

  const thumbnailLocalPath = getFilePath(req.files, "thumbnailUrl");
  const brochureLocalPath = getFilePath(req.files, "brochureUrl");

  let thumbnailUrl = existingLand.thumbnailUrl;
  let brochureUrl = existingLand.brochureUrl;
  let images = existingLand.images || [];

  /* ---------------- THUMBNAIL REPLACE ---------------- */

  if (thumbnailLocalPath) {
    const uploadedThumb = await uploadFile(
      thumbnailLocalPath,
      "OpenLand/Thumbnail",
    );
    if (!uploadedThumb) throw new ApiError(500, "Thumbnail upload failed");

    thumbnailUrl = uploadedThumb;
  }

  /* ---------------- BROCHURE REMOVE ---------------- */

  if (data.brochureRemoved === "true" || data.brochureRemoved === true) {
    brochureUrl = "";
  }

  /* ---------------- BROCHURE REPLACE ---------------- */

  if (brochureLocalPath) {
    const uploadedPdf = await uploadPdfToCloudinary(brochureLocalPath);
    if (!uploadedPdf) throw new ApiError(500, "Brochure upload failed");

    brochureUrl = uploadedPdf;
  }

  /* ===================================================== */
  /* 🔥 PRODUCTION IMAGE REPLACEMENT LOGIC STARTS HERE 🔥 */
  /* ===================================================== */

  // frontend sends remaining old images
  let existingImages = [];

  if (data.existingImages) {
    try {
      existingImages = JSON.parse(data.existingImages);
    } catch {
      existingImages = [];
    }
  }

  // upload newly added images
  let newImages = [];
  if (req.files?.images) {
    newImages = await Promise.all(
      req.files.images.map((file) => uploadFile(file.path, "OpenLand/Gallery")),
    );
  }

  // FINAL overwrite
  images = [...existingImages, ...newImages];

  /* ===================================================== */

  const updatedLand = await OpenLand.findByIdAndUpdate(
    id,
    {
      ...data,
      thumbnailUrl,
      brochureUrl,
      images,
    },
    { new: true, runValidators: true },
  );

  const populated = await populateOpenLand(
    OpenLand.findById(updatedLand._id),
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

  const land = await OpenLand.findById(id);
  if (!land) throw new ApiError(404, "Open land not found");

  land.interestedCustomers.push({
    lead: leadId,
    agent: agentId,
    createdAt: new Date(),
  });

  await land.save();

  const populated = await populateOpenLand(OpenLand.findById(id)).exec();

  res.status(200).json(new ApiResponse(200, populated));
});

export const updateInterestedCustomer = asyncHandler(async (req, res) => {
  const { id, interestId } = req.params;
  const { leadId, agentId } = req.body;

  const land = await OpenLand.findById(id);
  if (!land) throw new ApiError(404, "Land not found");

  const entry = land.interestedCustomers.id(interestId);
  if (!entry) throw new ApiError(404, "Interested entry not found");

  entry.lead = leadId;
  entry.agent = agentId;
  entry.updatedAt = new Date();

  await land.save();

  const populated = await populateOpenLand(OpenLand.findById(id)).exec();

  res.status(200).json(new ApiResponse(200, populated));
});

export const removeInterestedCustomer = asyncHandler(async (req, res) => {
  const { id, interestId } = req.params;

  await OpenLand.findByIdAndUpdate(id, {
    $pull: { interestedCustomers: { _id: interestId } },
  });

  const populated = await populateOpenLand(OpenLand.findById(id)).exec();

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

  const land = await OpenLand.findById(id);
  if (!land) throw new ApiError(404, "Open land not found");

  land.landStatus = "Sold";
  land.soldToCustomer = soldToCustomerId;
  land.soldDate = soldDate ? new Date(soldDate) : new Date();

  await land.save();

  const populated = await populateOpenLand(OpenLand.findById(id)).exec();

  res.status(200).json(new ApiResponse(200, populated));
});

/* ------------------------------------------------------- */
/* DROPDOWN */
/* ------------------------------------------------------- */

export const getOpenLandDropdown = asyncHandler(async (req, res) => {
  const openLands = await OpenLand.find().select("_id projectName");

  res
    .status(200)
    .json(new ApiResponse(200, openLands, "Open Land dropdown fetched"));
});
