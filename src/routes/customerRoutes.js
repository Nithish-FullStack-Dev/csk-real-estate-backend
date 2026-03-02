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
  authenticate,
  upload.fields([
    {
      name: "documents",
      maxCount: 5,
    },
  ]),
  createCustomer,
);
router.get("/getAllCustomers", authenticate, getAllCustomers);
router.get("/getCustomerById/:id", authenticate, getCustomerById);
router.get("/getCustomerByUser", authenticate, getCustomerByUser);
router.get("/getAllPurchasedProp", authenticate, getPurchasedProperties);
router.put(
  "/updateCustomer/:id",
  authenticate,
  upload.fields([
    {
      name: "documents",
      maxCount: 5,
    },
  ]),
  updateCustomer,
);

router.put(
  "/customers/:id/upload-pdf",
  authenticate,
  upload.single("pdf"),
  uploadCustomerPdf,
);

router.delete("/deleteCustomer/:id", authenticate, deleteCustomer);

export default router;
