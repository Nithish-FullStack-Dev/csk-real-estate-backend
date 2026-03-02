import express from "express";
import {
  addContractor,
  deleteContractor,
  getAllContractorList,
  getAllContractorsById,
  getContractorsForDropDown,
  updateContractor,
} from "../controller/contractor.controller.js";
import { upload } from "../middlewares/multer.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/addContractor",
  authenticate,
  upload.fields([
    {
      name: "billcopy",
      maxCount: 1,
    },
  ]),
  addContractor,
);
router.get("/getContractorById/:id", getAllContractorsById);

router.get("/getAllContractorList", getAllContractorList);

router.get("/getContractorsForDropDown", getContractorsForDropDown);

router.put(
  "/updateContractor/:id",
  authenticate,
  upload.fields([
    {
      name: "billcopy",
      maxCount: 1,
    },
  ]),
  updateContractor,
);

router.delete("/deleteContractor/:id", authenticate, deleteContractor);

export default router;
