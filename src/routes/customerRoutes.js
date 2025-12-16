import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerByUser,
  getPurchasedProperties,
  uploadCustomerPdf,
} from "../controller/customerController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.post(
  "/addCustomer",
  upload.fields([
    {
      name: "documents",
      maxCount: 5,
    },
  ]),
  createCustomer
);
router.get("/getAllCustomers", getAllCustomers);
router.get("/getCustomerById/:id", getCustomerById);
router.get("/getCustomerByUser", authenticate, getCustomerByUser);
router.get("/getAllPurchasedProp", getPurchasedProperties);
router.put(
  "/updateCustomer/:id",
  upload.fields([
    {
      name: "documents",
      maxCount: 5,
    },
  ]),
  updateCustomer
);

router.put(
  "/customers/:id/upload-pdf",
  upload.single("pdf"),
  uploadCustomerPdf
);

router.delete("/deleteCustomer/:id", deleteCustomer);

export default router;
