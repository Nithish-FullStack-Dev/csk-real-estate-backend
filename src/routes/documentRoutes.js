// routes/documentRoutes.js (or .ts)
import express from "express";
import { upload } from "../middlewares/multer.js"; // your file
import {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from "../controller/documentController.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/getAllDocuments", getAllDocuments);
router.get("/getDocumentById/:id", getDocumentById);
router.put("/updateDocument/:id", updateDocument);
router.delete("/deleteDocument/:id", deleteDocument);

export default router;
