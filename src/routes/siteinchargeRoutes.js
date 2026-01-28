import express from "express";
import { getSiteIncharges } from "../controller/siteinchargeController.js";

const router = express.Router();

router.get("/site-incharges", getSiteIncharges);

export default router;
