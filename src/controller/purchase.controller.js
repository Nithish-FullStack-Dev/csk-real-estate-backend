import { Purchase } from "../modals/purchase.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createPurchase = asyncHandler(async (req, res) => {
  const {
    partyName,
    companyName,
    project,
    agent,
    propertyDescription,
    paymentPlan,
    registrationStatus,
    totalSaleConsideration,
    advance,
    lastPaymentDate,
    nextPaymentDate,
    paymentDetails,
    notes,
  } = req.body;

  if (
    !partyName ||
    !project ||
    !agent ||
    !paymentPlan ||
    totalSaleConsideration === undefined
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  const purchase = await Purchase.create({
    partyName,
    companyName,
    project,
    agent,
    propertyDescription,
    paymentPlan,
    registrationStatus,
    totalSaleConsideration,
    advance,
    lastPaymentDate,
    nextPaymentDate,
    paymentDetails,
    notes,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, purchase, "Purchase created successfully"));
});

export const getAllPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ isDeleted: false })
    .populate({
      path: "project",
      select: "projectId floorUnit unit",
      populate: [
        {
          path: "projectId",
          model: "Building",
          select: "_id projectName",
        },
        {
          path: "floorUnit",
          model: "FloorUnit",
          select: "_id floorNumber unitType",
        },
        {
          path: "unit",
          model: "PropertyUnit",
          select: "_id plotNo propertyType",
        },
      ],
    })
    .populate("agent", "_id name email")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, purchases, "Purchases fetched successfully"));
});

export const getPurchaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid purchase ID");
  }

  const purchase = await Purchase.findOne({ _id: id, isDeleted: false })
    .populate("project", "_id projectName")
    .populate("agent", "_id name email");

  if (!purchase) {
    throw new ApiError(404, "Purchase not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, purchase, "Purchase fetched successfully"));
});

export const updatePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid purchase ID");
  }

  const purchase = await Purchase.findOne({ _id: id, isDeleted: false });
  if (!purchase) {
    throw new ApiError(404, "Purchase not found");
  }

  Object.assign(purchase, req.body);

  purchase.updatedBy = req.user._id;

  await purchase.save();

  return res
    .status(200)
    .json(new ApiResponse(200, purchase, "Purchase updated successfully"));
});

export const deletePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid purchase ID");
  }

  const purchase = await Purchase.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, deletedBy: req.user._id },
    { new: true },
  );

  if (!purchase) {
    throw new ApiError(404, "Purchase not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Purchase deleted successfully"));
});
