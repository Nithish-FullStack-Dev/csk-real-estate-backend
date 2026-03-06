import express from "express";
import {
  getDocuments,
  addDocument,
  updateTaxDocStatus,
  updateAuditStatus,
} from "../controller/taxDocumentsController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("accountant", "owner", "admin"),
  addDocument,
);
router.get(
  "/",
  authenticate,
  authorizeRoles("accountant", "owner", "admin"),
  getDocuments,
);
router.put(
  "/updateStatus/:docId",
  authenticate,
  authorizeRoles("accountant", "owner", "admin"),
  updateTaxDocStatus,
);
router.put(
  "/updateAuditStatus/:docId",
  authenticate,
  authorizeRoles("accountant", "owner", "admin"),
  updateAuditStatus,
);

export default router;
