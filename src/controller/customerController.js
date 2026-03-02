import Customer from "../modals/customerSchema.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { uploadFile } from "../utils/uploadFile.js";
import { uploadPdfToCloudinary } from "../config/cloudinary.js";

export const createCustomer = asyncHandler(async (req, res) => {
  const {
    customerId,
    purchasedFrom,
    projectCompany,
    property,
    floorUnit,
    unit,
    referralName,
    referralContact,
    registrationStatus,
    bookingDate,
    totalAmount,
    advanceReceived,
    lastPaymentDate,
    paymentPlan,
    paymentDetails,
    notes,
    contractorId,
    siteInchargeId,
    constructionStage,
    expectedDeliveryDate,
    deliveryDate,
    status,
    finalPrice,
    paymentStatus,
  } = req.body;

  if (
    !customerId ||
    !projectCompany ||
    !property ||
    !floorUnit ||
    !unit ||
    !totalAmount ||
    !contractorId ||
    !siteInchargeId
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  const existCustomer = await Customer.findOne({ customerId });

  if (existCustomer)
    throw new ApiError(409, "Customer already exists with this Customer ID");

  // Upload documents (images only)
  const documentLocalfile = req.files?.documents || [];
  const uploadedDocuments = [];

  for (const file of documentLocalfile) {
    const fileUrl = await uploadFile(file.path, "Document");
    uploadedDocuments.push(fileUrl);
  }

  const newCustomer = await Customer.create({
    customerId,
    purchasedFrom,
    projectCompany,
    property,
    floorUnit,
    unit,
    referralName,
    referralContact,
    registrationStatus,
    bookingDate,
    totalAmount,
    advanceReceived,
    lastPaymentDate,
    paymentPlan,
    paymentDetails,
    notes,
    contractorId,
    siteInchargeId,
    constructionStage,
    expectedDeliveryDate,
    deliveryDate,
    status,
    finalPrice,
    paymentStatus,
    images: uploadedDocuments,
    createdBy: req.user?._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, newCustomer, "Successfully added Customer"));
});

//! GET ALL CUSTOMERS
export const getAllCustomers = asyncHandler(async (req, res) => {
  const purchases = await Customer.find({ isDeleted: false })
    .populate("customerId", "_id name email phone avatar")
    .populate("purchasedFrom", "_id name email role")
    .populate("property", "_id projectName location propertyType")
    .populate("floorUnit", "_id floorNumber unitType")
    .populate("unit", "_id plotNo propertyType")
    .populate("contractorId", "_id name email phone")
    .populate("siteInchargeId", "_id name email phone")
    .populate("images");

  res
    .status(200)
    .json(new ApiResponse(200, purchases, "Successfully fetched Customers"));
});

//! GET SINGLE CUSTOMER
export const getCustomerById = asyncHandler(async (req, res) => {
  const purchase = await Customer.findOne({
    _id: req.params.id,
    isDeleted: false,
  })
    .populate("customerId", "_id name email phone avatar")
    .populate("purchasedFrom", "_id name email role")
    .populate("property", "_id projectName location propertyType")
    .populate("floorUnit", "_id floorNumber unitType")
    .populate("unit", "_id plotNo propertyType")
    .populate("contractorId", "_id name email phone")
    .populate("siteInchargeId", "_id name email phone")
    .populate("images");

  if (!purchase) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Customer not found"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, purchase, "Successfully fetched Customer"));
});

//! UPDATE CUSTOMER

export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new ApiError(400, "Customer ID is required");

  const updateData = { ...req.body, updatedBy: req.user?._id };

  const existing = await Customer.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!existing) throw new ApiError(404, "Customer not found");

  let uploadedDocuments = [];

  if (req.files?.documents?.length > 0) {
    for (const file of req.files.documents) {
      const fileUrl = await uploadFile(file.path, "Document");
      uploadedDocuments.push(fileUrl);
    }
  }

  // Merge existing images with new uploads
  updateData.images = [...existing.images, ...uploadedDocuments];

  if (
    updateData.totalAmount !== undefined ||
    updateData.advanceReceived !== undefined
  ) {
    const total = updateData.totalAmount ?? existing.totalAmount;
    const advance = updateData.advanceReceived ?? existing.advanceReceived;

    updateData.balancePayment = total - advance;
  }

  const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedCustomer) {
    throw new ApiError(404, "Customer not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedCustomer, "Customer updated"));
});

//! DELETE CUSTOMER
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Customer ID is required");
  }

  const deleted = await Customer.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedBy: req.user?._id,
    },
    { new: true },
  );

  if (!deleted) {
    throw new ApiError(404, "Customer not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Customer deleted successfully"));
});

//! Get Customer by User Id
export const getCustomerByUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const purchases = await Customer.find({
    customerId: userId,
    isDeleted: false,
  })
    .populate("customerId", "_id name email avatar phone")
    .populate("purchasedFrom", "_id name email phone role")
    .populate("property", "_id projectName location propertyType")
    .populate("floorUnit", "_id floorNumber unitType")
    .populate("unit", "_id plotNo propertyType status")
    .populate("contractorId", "_id companyName phoneNumber")
    .populate("siteInchargeId", "_id name email phone")
    .populate("images");

  if (!purchases || purchases.length === 0) {
    throw new ApiError(404, "No purchases found for this customer");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        purchases,
        "Successfully fetched customer purchases",
      ),
    );
});

//! Get All Purchased Property
export const getPurchasedProperties = asyncHandler(async (req, res) => {
  const purchases = await Customer.find({ isDeleted: false }).populate(
    "unit",
    "status plotNo propertyType",
  );

  if (!purchases || purchases.length === 0) {
    throw new ApiError(404, "No purchased properties found");
  }

  const result = purchases
    .filter((p) => p.unit)
    .map((p) => ({
      _id: p.unit._id,
      status: p.unit.status,
      plotNo: p.unit.plotNo,
      propertyType: p.unit.propertyType,
    }));

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Successfully fetched purchased properties"),
    );
});

export const uploadCustomerPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await Customer.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!customer) throw new ApiError(404, "Customer not found");

  // Multer validation
  if (!req.file?.path) throw new ApiError(400, "PDF file is required");

  if (req.file.mimetype !== "application/pdf")
    throw new ApiError(400, "Only PDF files are allowed");

  // Upload to Cloudinary
  const pdfUrl = await uploadPdfToCloudinary(req.file.path);
  if (!pdfUrl) throw new ApiError(500, "Failed to upload PDF");

  // Save PDF URL
  customer.pdfDocument = pdfUrl;
  await customer.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        customerId: customer._id,
        pdfDocument: customer.pdfDocument,
      },
      "PDF uploaded successfully",
    ),
  );
});
