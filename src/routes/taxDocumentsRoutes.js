import express from "express";
import {
  getDocuments,
  addDocument,
  updateTaxDocStatus,
  updateAuditStatus,
} from "../controller/taxDocumentsController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, addDocument);
router.get("/", authenticate, getDocuments);
router.put("/updateStatus/:docId", authenticate, updateTaxDocStatus);
router.put("/updateAuditStatus/:docId", authenticate, updateAuditStatus);

export default router;
