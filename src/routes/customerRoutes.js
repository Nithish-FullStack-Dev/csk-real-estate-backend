import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerByUser,
  getPurchasedProperties,
} from "../controller/customerController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/addCustomer", createCustomer);
router.get("/getAllCustomers", getAllCustomers);
router.get("/getCustomerById/:id", getCustomerById);
router.get("/getCustomerByUser", authenticate, getCustomerByUser);
router.get("/getAllPurchasedProp", getPurchasedProperties);
router.put("/updateCustomer/:id", updateCustomer);
router.delete("/deleteCustomer/:id", deleteCustomer);

export default router;
