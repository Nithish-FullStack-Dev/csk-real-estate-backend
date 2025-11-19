import express from "express";
import {
  addInterestedCustomer,
  createOpenLand,
  deleteOpenLandById,
  getAllOpenLand,
  getOpenLandById,
  removeInterestedCustomer,
  updateInterestedCustomer,
  updateOpenLand,
} from "../controller/openLandController.js";

const router = express.Router();

router.post("/saveOpenLand", createOpenLand);
router.get("/getAllOpenLand", getAllOpenLand);
router.get("/getOpenLandById/:id", getOpenLandById);
router.delete("/deleteOpenLand/:id", deleteOpenLandById);
router.put("/updateOpenLand/:id", updateOpenLand);
router.post("/:id/addInterestedCustomer", addInterestedCustomer);
router.put(
  "/:id/updateInterestedCustomer/:interestId",
  updateInterestedCustomer
);
router.delete(
  "/:id/removeInterestedCustomer/:interestId",
  removeInterestedCustomer
);

export default router;
