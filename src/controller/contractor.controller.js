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

  const exists = await ContractorModel.findOne({
    $or: [{ userId }, { gstNumber }, { panCardNumber }],
  });

  if (exists) {
    throw new ApiError(
      409,
      "Contractor with same Name GST or PAN already exists",
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
  const contractors = await ContractorModel.find({ isDeleted: false })
    .populate("userId", "name email phone")
    .populate("siteIncharge", "name email phone")
    .populate("accountsIncharge", "name email phone");
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
  // });

  res
    .status(200)
    .json(
      new ApiResponse(200, contractors, "contractors fetched successfully"),
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

    // ✅ 1. Get contractor
    const contractor = await ContractorModel.findById(id).session(session);

    if (!contractor) {
      throw new ApiError(404, "Contractor not found");
    }

    // 🔥 IMPORTANT: extract USER ID
    const contractorUserId = contractor.userId.toString();

    /* =========================================
       ✅ 2. REMOVE FROM contractors ARRAY (FIXED)
    ========================================= */
    await Project.updateMany(
      { contractors: contractor.userId }, // 👈 MATCH USER ID
      { $pull: { contractors: contractor.userId } },
    ).session(session);

    /* =========================================
       ✅ 3. CLEAN assignedContractors + TASKS
    ========================================= */
    const projects = await Project.find({}).session(session);

    for (const project of projects) {
      let modified = false;

      // 🔹 assignedContractors
      if (project.assignedContractors instanceof Map) {
        for (const [
          unitKey,
          contractorList,
        ] of project.assignedContractors.entries()) {
          const filtered = contractorList.filter(
            (cId) => cId.toString() !== contractorUserId,
          );

          if (filtered.length !== contractorList.length) {
            project.assignedContractors.set(unitKey, filtered);
            modified = true;
          }
        }
      }

      // 🔹 tasks cleanup
      if (project.units instanceof Map) {
        for (const [unitKey, tasks] of project.units.entries()) {
          const filteredTasks = tasks.filter(
            (task) => task.contractor?.toString() !== contractorUserId,
          );

          if (filteredTasks.length !== tasks.length) {
            project.units.set(unitKey, filteredTasks);
            modified = true;
          }
        }
      }

      if (modified) {
        project.markModified("units");
        project.markModified("assignedContractors");
        await project.save({ session });
      }
    }

    /* =========================================
       ✅ 4. DELETE CONTRACTOR
    ========================================= */
    await ContractorModel.findByIdAndDelete(id).session(session);

    /* =========================================
       ✅ 5. AUDIT LOG
    ========================================= */
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
      .json(
        new ApiResponse(
          200,
          null,
          "Contractor unassigned and deleted successfully",
        ),
      );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const getContractorsForDropDown = asyncHandler(async (req, res) => {
  const contractors = await ContractorModel.find({}, "userId").populate(
    "userId",
    "_id name email phone",
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, contractors, "contractors fetched successfully"),
    );
});
