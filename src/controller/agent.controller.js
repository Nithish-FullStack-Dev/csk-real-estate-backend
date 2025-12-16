import AgentModel from "../modals/agent.model.js";
import TeamManagement from "../modals/teamManagementModal.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";

export const addAgentModel = asyncHandler(async (req, res) => {
  const {
    agentId,
    panCard,
    aadharCard,
    accountHolderName,
    accountNumber,
    ifsc,
    bankName,
    branchName,
    project,
    agreedCommissionPercent,
    totalAmount,
    amountReceived,
    commissionPaid,
    paymentDate,
    notes,
    approvedBy,
  } = req.body;

  if (
    !panCard ||
    !aadharCard ||
    !accountHolderName ||
    !accountNumber ||
    !ifsc ||
    !totalAmount
  )
    throw new ApiError(400, "Required fields are missing");

  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(400, "Invalid userId");
  }

  if (!mongoose.Types.ObjectId.isValid(project)) {
    throw new ApiError(400, "Invalid userId");
  }

  const exists = await AgentModel.findOne({
    $or: [{ panCard }, { accountNumber }, { aadharCard }],
  });

  if (exists)
    throw new ApiError(
      409,
      "Agent with same Aadhar, Account Number or PAN already exists"
    );

  const agent = await AgentModel.create({
    agentId,
    panCard,
    aadharCard,
    accountHolderName,
    accountNumber,
    ifsc,
    bankName,
    branchName,
    project,
    agreedCommissionPercent,
    totalAmount,
    amountReceived,
    commissionPaid,
    paymentDate,
    notes,
    approvedBy,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, agent, "agent added successfully"));
});

export const getAllAgents = asyncHandler(async (req, res) => {
  const agents = await AgentModel.find()
    .populate("agentId", "_id name phone")
    .populate({
      path: "project",
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
      select: "projectId floorUnit unit",
    });

  res
    .status(200)
    .json(new ApiResponse(200, agents, "agents fetched successfully"));
});

export const getAgentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid contractor ID");
  }

  const agent = await AgentModel.findOne(id)
    .populate("agentId", "_id name phone")
    .populate({
      path: "project",
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
      select: "projectId floorUnit unit",
    });

  if (!agent) throw new ApiError(404, "agent not found");

  res
    .status(200)
    .json(new ApiResponse(200, agent, "agent fetched successfully"));
});

export const updateAgentModel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid contractor ID");
  }

  const {
    agentId,
    panCard,
    aadharCard,
    accountHolderName,
    accountNumber,
    ifsc,
    bankName,
    branchName,
    project,
    agreedCommissionPercent,
    totalAmount,
    amountReceived,
    commissionPaid,
    paymentDate,
    notes,
    approvedBy,
  } = req.body;

  const exists = await AgentModel.findOne({
    $or: [{ panCard }, { accountNumber }, { aadharCard }],
    _id: { $ne: id },
  });

  if (exists)
    throw new ApiError(
      409,
      "Agent with same Aadhar, Account Number or PAN already exists"
    );

  const payload = {
    agentId,
    panCard,
    aadharCard,
    accountHolderName,
    accountNumber,
    ifsc,
    bankName,
    branchName,
    project,
    agreedCommissionPercent,
    totalAmount,
    amountReceived,
    commissionPaid,
    paymentDate,
    notes,
    approvedBy,
  };

  const updatedAgent = await AgentModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedAgent) {
    throw new ApiError(404, "Agent not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedAgent, "Agent updated successfully"));
});

export const deleteAgentModel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid contractor ID");
  }

  const deletedAgent = await AgentModel.findByIdAndDelete(id);

  if (!deletedAgent) throw new ApiError(404, "Agent not found");

  res
    .status(200)
    .json(new ApiResponse(200, deletedAgent, "Agent deleted successfully"));
});

export const getAllAgentsForDropDown = asyncHandler(async (req, res) => {
  const assignedAgentIds = await TeamManagement.distinct("agentId");
  const agents = await AgentModel.find(
    {
      agentId: { $nin: assignedAgentIds },
    },
    "agentId"
  ).populate("agentId", "_id name email phone");
  res
    .status(200)
    .json(new ApiResponse(200, agents, "agents fetched successfully"));
});
