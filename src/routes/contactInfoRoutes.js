import express from "express";
import {
  getContactInfo,
  updateContactInfo,
} from "../controller/contactInfoController.js";

const router = express.Router();

router.get("/contactInfo", getContactInfo);
router.post("/updateContactInfo", updateContactInfo);

export default router;
