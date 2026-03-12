import CustomerPayment from "../modals/CustomerPayment.js";
import Customer from "../modals/customerSchema.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addCustomerPayment = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  const { amount, date, paymentMode, referenceNumber, remarks } = req.body;

  const customer = await Customer.findById(customerId);

  if (!customer) throw new ApiError(404, "Customer not found");

  await CustomerPayment.create({
    customerId,
    amount,
    date,
    paymentMode,
    referenceNumber,
    remarks,
    createdBy: req.user?._id,
  });

  await Customer.recalculateBalance(customerId);

  res.json(new ApiResponse(200, null, "Payment added successfully"));
});

export const getCustomerLedger = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  const payments = await CustomerPayment.find({
    customerId,
  }).sort({ date: 1 });

  res.json(new ApiResponse(200, payments, "Payment fetched successfully"));
});

export const deleteCustomerPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await CustomerPayment.findById(paymentId);

  if (!payment) throw new ApiError(404, "Not found");

  const customerId = payment.customerId;

  await payment.deleteOne();

  await Customer.recalculateBalance(customerId);

  res.json(new ApiResponse(200, null, "Payment removed"));
});
