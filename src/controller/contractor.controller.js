import ContractorModel from "../modals/contractor.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getFilePath } from "../utils/getFilePath.js";
import { uploadFile } from "../utils/uploadFile.js";
import mongoose from "mongoose";
import { createNotification } from "../utils/notificationHelper.js";
import { AuditLog } from "../modals/auditLog.model.js";
import Project from "../modals/projects.js";

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
    // projectsAssigned,
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

  const conditions = [];

  if (gstNumber) conditions.push({ gstNumber });

  if (panCardNumber) conditions.push({ panCardNumber });

  if (userId) conditions.push({ userId });

  if (conditions.length > 0) {
    const exists = await ContractorModel.findOne({
      $or: conditions,
    });

    if (exists) {
      if (!exists.isDeleted) {
        throw new ApiError(
          409,
          "Contractor with same Name GST or PAN already exists",
        );
      }
      throw new ApiError(
        409,
        "Contractor exists but deleted. You can restore it",
      );
    }
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
    // projectsAssigned,

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
    createdBy: req.user._id,
  });
  await createNotification({
    userId: [userId],
    title: "New Project Assigned",
    message:
      "A new construction project has been assigned to you. Please review the details and proceed accordingly.",
    triggeredBy: req.user._id,
    category: "project",
    priority: "P2",
    deepLink: `/contractors/${contractor._id}`,
    entityType: "Contractor",
    entityId: contractor._id,
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
    // .populate({
    //   path: "projectsAssigned",
    //   populate: [
    //     {
    //       path: "projectId",
    //       model: "Building",
    //       select: "projectName location",
    //     },
    //     {
    //       path: "floorUnit",
    //       model: "FloorUnit",
    //       select: "floorNumber",
    //     },
    //     {
    //       path: "unit",
    //       model: "PropertyUnit",
    //       select: "plotNo",
    //     },
    //   ],
    // })
    .lean();

  if (!contractor) throw new ApiError(404, "contrator not found");

  res
    .status(200)
    .json(new ApiResponse(200, contractor, "contractor fetched successfully"));
});

export const getAllContractorList = asyncHandler(async (req, res) => {
  const contractors = await ContractorModel.find()
    .populate({
      path: "userId",
      select: "name email phone isDeleted",
    })
    .populate("siteIncharge", "name email phone isDeleted")
    .populate("accountsIncharge", "name email phone isDeleted");

  const sorted = contractors.sort((a, b) => {
    const aDeleted = a.userId?.isDeleted ? 1 : 0;
    const bDeleted = b.userId?.isDeleted ? 1 : 0;

    // 1️⃣ Deleted last
    if (aDeleted !== bDeleted) return aDeleted - bDeleted;

    // 2️⃣ Latest updated first
    const aUpdated = new Date(a.updatedAt).getTime();
    const bUpdated = new Date(b.updatedAt).getTime();

    if (aUpdated !== bUpdated) return bUpdated - aUpdated;

    // 3️⃣ fallback: createdAt
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res
    .status(200)
    .json(new ApiResponse(200, sorted, "contractors fetched successfully"));
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
    // projectsAssigned,

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

  let conditions = [];

  if (gstNumber) conditions.push({ gstNumber });
  if (panCardNumber) conditions.push({ panCardNumber });

  if (gstNumber || panCardNumber) {
    if (conditions.length > 0) {
      const exists = await ContractorModel.findOne({
        _id: { $ne: id },
        $or: conditions,
      });

      if (exists) {
        if (!exists.isDeleted) {
          throw new ApiError(
            409,
            "Contractor with same GST or PAN already exists",
          );
        }
        throw new ApiError(
          409,
          "Contractor exists but deleted. You can restore it",
        );
      }
    }
  }

  let normalizedProjectsAssigned = [];

  // if (projectsAssigned !== undefined) {
  //   if (Array.isArray(projectsAssigned)) {
  //     normalizedProjectsAssigned = projectsAssigned;
  //   } else {
  //     normalizedProjectsAssigned = [projectsAssigned];
  //   }
  // } else {
  //   normalizedProjectsAssigned = [];
  // }

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
    // projectsAssigned: normalizedProjectsAssigned,

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
    updatedBy: req.user._id,
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
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid contractor ID");
  }

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const contractor = await ContractorModel.findById(id).session(session);

    if (!contractor) {
      throw new ApiError(404, "Contractor not found");
    }

    if (contractor.isDeleted) {
      throw new ApiError(400, "Contractor already deleted");
    }

    contractor.isDeleted = true;
    contractor.deletedBy = userId || null;
    contractor.isActive = false;

    await contractor.save({ session });

    await AuditLog.create(
      [
        {
          operationType: "delete",
          database: "CSKestate",
          collectionName: "contractors",
          documentId: contractor._id,
          fullDocument: contractor.toObject(),
          previousFields: contractor.toObject(),
          changeEventId: new mongoose.Types.ObjectId().toString(),
          userId: userId || null,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Contractor deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const getContractorsForDropDown = asyncHandler(async (req, res) => {
  const contractors = await ContractorModel.find(
    { isDeleted: false },
    "userId",
  ).populate({
    path: "userId",
    select: "_id name email phone",
    match: { isDeleted: false },
  });

  const filterContractors = contractors.filter((con) => con.userId);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        filterContractors,
        "contractors fetched successfully",
      ),
    );
});

export const restoreContractor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid contractor ID");
  }

  const contractor = await ContractorModel.findOneAndUpdate(
    { _id: id, isDeleted: true },
    {
      isDeleted: false,
      deletedBy: null,
      isActive: true,
    },
    { new: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, contractor, "Contractor restored successfully"));
});
