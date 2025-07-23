import express from "express";
import {
  createEnquiryForm,
  getAllEnquiries,
  updateEnquiry,
} from "../controller/enquiryFormController.js";

const router = express.Router();

router.post("/saveForm", createEnquiryForm);
router.get("/getAllEnquirys", getAllEnquiries);
router.patch("/updateEnquiry/:id", updateEnquiry);

export default router;
