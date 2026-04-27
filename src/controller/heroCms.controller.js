import HeroCms from "../modals/heroCms.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const buildImageUrl = (req, file) => {
  if (!file) return "";
  return `${req.protocol}://${req.get("host")}/api/uploads/images/${file.filename}`;
};

export const addHeroCms = asyncHandler(async (req, res) => {
  const { title, subtitle, cta, link } = req.body;

  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  if (!subtitle?.trim()) {
    throw new ApiError(400, "Subtitle is required");
  }

  const imageFile = req.files?.image?.[0];

  const payload = {
    title: title.trim(),
    subtitle: subtitle.trim(),
  };

  if (cta?.trim()) payload.cta = cta.trim();
  if (link?.trim()) payload.link = link.trim();

  const imageUrl = buildImageUrl(req, imageFile);

  if (imageUrl) {
    payload.image = imageUrl;
  }

  const hero = await HeroCms.create(payload);

  return res
    .status(201)
    .json(new ApiResponse(201, hero, "Hero CMS created successfully"));
});

export const upsertBanners = async (req, res) => {
  try {
    const slides = req.body.slides;

    // Delete existing
    await HeroCms.deleteMany({});

    // Insert new
    const inserted = await HeroCms.insertMany(slides);
    res.status(200).json({ success: true, banners: inserted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllHeroCms = asyncHandler(async (_req, res) => {
  const data = await HeroCms.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Hero CMS fetched successfully"));
});

export const getHeroCmsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid hero id");
  }

  const hero = await HeroCms.findById(id);

  if (!hero) {
    throw new ApiError(404, "Hero CMS not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, hero, "Hero CMS fetched successfully"));
});

export const updateHeroCms = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, cta, link } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid hero id");
  }

  const hero = await HeroCms.findById(id);

  if (!hero) {
    throw new ApiError(404, "Hero CMS not found");
  }

  if (title !== undefined) {
    if (!title.trim()) {
      throw new ApiError(400, "Title cannot be empty");
    }
    hero.title = title.trim();
  }

  if (subtitle !== undefined) {
    if (!subtitle.trim()) {
      throw new ApiError(400, "Subtitle cannot be empty");
    }
    hero.subtitle = subtitle.trim();
  }

  if (cta !== undefined) {
    hero.cta = cta.trim();
  }

  if (link !== undefined) {
    hero.link = link.trim();
  }

  const imageFile = req.files?.image?.[0];

  if (imageFile) {
    hero.image = buildImageUrl(req, imageFile);
  }

  await hero.save();

  return res
    .status(200)
    .json(new ApiResponse(200, hero, "Hero CMS updated successfully"));
});

export const deleteHeroCms = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid hero id");
  }

  const hero = await HeroCms.findById(id);

  if (!hero) {
    throw new ApiError(404, "Hero CMS not found");
  }

  await hero.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Hero CMS deleted successfully"));
});
