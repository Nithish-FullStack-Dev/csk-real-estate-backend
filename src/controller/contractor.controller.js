import ContractorModel from "../modals/contractor.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";
import mongoose from "mongoose";

export const addContractor = asyncHandler(async (req, res) => {
  const {
    userId,
    companyName,
    gstNumber,
    panCardNumber,
    contractorType,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    contractStartDate,
    contractEndDate,
    siteIncharge,
    accountsIncharge,
    projectsAssigned,
    amount,
    advancePaid,
    balancePaid,
    billInvoiceNumber,
    workDetails,
    billedDate,
    billApprovedBySiteIncharge,
    billProcessedByAccountant,
    finalPaymentDate,
    isActive,
    paymentDetails,
  } = req.body;

  if (
    !userId ||
    !companyName ||
    !gstNumber ||
    !panCardNumber ||
    !siteIncharge ||
    !amount ||
    !bankName ||
    !branchName ||
    !ifscCode ||
    !paymentDetails ||
    !accountNumber
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  if (!mongoose.Types.ObjectId.isValid(siteIncharge)) {
    throw new ApiError(400, "Invalid siteIncharge");
  }

  const billCopyLocalPath = getFilePath(req.files, "billcopy");
  let uploadedBillCopy = null;

  if (billCopyLocalPath) {
    uploadedBillCopy = await uploadFile(billCopyLocalPath);
  }

  const exists = await ContractorModel.findOne({
    $or: [{ userId }, { gstNumber }, { panCardNumber }],
  });

  if (exists) {
    throw new ApiError(
      409,
      "Contractor with same Name GST or PAN already exists"
    );
  }

  const contractor = await ContractorModel.create({
    userId,
    companyName,
    gstNumber,
    panCardNumber,
    contractorType,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    contractStartDate,
    contractEndDate,

    siteIncharge,
    accountsIncharge,
    projectsAssigned,

    amount,
    advancePaid,
    balancePaid,
    paymentDetails,
    billInvoiceNumber,
    billCopy: uploadedBillCopy,
    workDetails,
    billedDate,
    billApprovedBySiteIncharge,
    billProcessedByAccountant,
    finalPaymentDate,
    isActive,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, contractor, "Contractor added successfully"));
});

export const getAllContractorsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid contractor ID");

  const contractor = await ContractorModel.findById(id)
    // .populate("userId siteIncharge accountsIncharge projectsAssigned")
    .populate("userId", "name email phone")
    .populate("siteIncharge", "name email phone")
    .populate("accountsIncharge", "name email phone")
    .populate({
      path: "projectsAssigned",
      populate: [
        {
          path: "projectId",
          model: "Building",
          select: "projectName location",
        },
        {
          path: "floorUnit",
          model: "FloorUnit",
          select: "floorNumber",
        },
        {
          path: "unit",
          model: "PropertyUnit",
          select: "plotNo",
        },
      ],
    })
    .lean();

  if (!contractor) throw new ApiError(404, "contrator not found");

  res
    .status(200)
    .json(new ApiResponse(200, contractor, "contractor fetched successfully"));
});

export const getAllContractorList = asyncHandler(async (req, res) => {
  const contractors = await ContractorModel.find()
    .populate("userId", "name email phone")
    .populate("siteIncharge", "name email phone")
    .populate("accountsIncharge", "name email phone")
    .populate({
      path: "projectsAssigned",
      populate: [
        {
          path: "projectId",
          model: "Building",
          select: "projectName location",
        },
        {
          path: "floorUnit",
          model: "FloorUnit",
          select: "floorNumber",
        },
        {
          path: "unit",
          model: "PropertyUnit",
          select: "plotNo",
        },
      ],
    });

  res
    .status(200)
    .json(
      new ApiResponse(200, contractors, "contractors fetched successfully")
    );
});

export const updateContractor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid contractor ID");
  }

  const {
    companyName,
    gstNumber,
    panCardNumber,
    contractorType,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    contractStartDate,
    contractEndDate,

    siteIncharge,
    accountsIncharge,
    projectsAssigned,

    amount,
    advancePaid,
    balancePaid,
    billInvoiceNumber,
    workDetails,
    billedDate,
    billApprovedBySiteIncharge,
    billProcessedByAccountant,
    finalPaymentDate,
    isActive,
    paymentDetails,
  } = req.body;

  if (siteIncharge && !mongoose.Types.ObjectId.isValid(siteIncharge)) {
    throw new ApiError(400, "Invalid siteIncharge ID");
  }

  const billCopyLocalPath = getFilePath(req.files, "billcopy");
  let uploadedBillCopy;

  if (billCopyLocalPath) {
    uploadedBillCopy = await uploadFile(billCopyLocalPath);
  }

  if (gstNumber || panCardNumber) {
    const exists = await ContractorModel.findOne({
      _id: { $ne: id },
      $or: [{ gstNumber }, { panCardNumber }],
    });

    if (exists) {
      throw new ApiError(409, "Contractor with same GST or PAN already exists");
    }
  }

  let normalizedProjectsAssigned = [];

  if (projectsAssigned !== undefined) {
    if (Array.isArray(projectsAssigned)) {
      normalizedProjectsAssigned = projectsAssigned;
    } else {
      normalizedProjectsAssigned = [projectsAssigned];
    }
  } else {
    normalizedProjectsAssigned = [];
  }

  const updateData = {
    companyName,
    gstNumber,
    panCardNumber,
    contractorType,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    contractStartDate,
    contractEndDate,

    siteIncharge,
    accountsIncharge,
    projectsAssigned: normalizedProjectsAssigned,

    amount,
    advancePaid,
    balancePaid,
    paymentDetails,
    billInvoiceNumber,
    workDetails,
    billedDate,
    billApprovedBySiteIncharge,
    billProcessedByAccountant,
    finalPaymentDate,
    isActive,
  };

  if (uploadedBillCopy) updateData.billCopy = uploadedBillCopy;

  const contractor = await ContractorModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!contractor) {
    throw new ApiError(404, "Contractor not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, contractor, "Contractor updated successfully"));
});

export const deleteContractor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(400, "Invalid contractor ID");

  const contractor = await ContractorModel.findByIdAndDelete(id);

  if (!contractor) throw new ApiError(404, "Contractor not found");

  res
    .status(200)
    .json(new ApiResponse(200, contractor, "Contractor deleted successfully"));
});

export const getContractorsForDropDown = asyncHandler(async (req, res) => {
  const contractors = await ContractorModel.find({}, "userId").populate(
    "userId",
    "_id name email phone"
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, contractors, "contractors fetched successfully")
    );
});
