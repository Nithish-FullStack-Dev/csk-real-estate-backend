import Faq from "../modals/faq.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";

export const addFaq = asyncHandler(async (req, res) => {
  const { question, answer } = req.body;

  if (!question?.trim() || !answer?.trim()) {
    throw new ApiError(400, "Question and answer are required");
  }

  const faq = await Faq.create({
    question: question.trim(),
    answer: answer.trim(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, faq, "Faq created successfully"));
});

export const getAllFaq = asyncHandler(async (req, res) => {
  const faqs = await Faq.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, faqs, "Faq fetched successfully"));
});

export const getFaqById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid faq id");
  }

  const faq = await Faq.findById(id);

  if (!faq) {
    throw new ApiError(404, "Faq not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, faq, "Faq fetched successfully"));
});

export const updateFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid faq id");
  }

  if (!question?.trim() || !answer?.trim()) {
    throw new ApiError(400, "Question and answer are required");
  }

  const faq = await Faq.findByIdAndUpdate(
    id,
    {
      question: question.trim(),
      answer: answer.trim(),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!faq) {
    throw new ApiError(404, "Faq not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, faq, "Faq updated successfully"));
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid faq id");
  }

  const faq = await Faq.findByIdAndDelete(id);

  if (!faq) {
    throw new ApiError(404, "Faq not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, faq, "Faq deleted successfully"));
});
