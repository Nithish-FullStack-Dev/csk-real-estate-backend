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

const router = express.Router();

router.post(
  "/addContractor",
  upload.fields([
    {
      name: "billcopy",
      maxCount: 1,
    },
  ]),
  addContractor
);
router.get("/getContractorById/:id", getAllContractorsById);

router.get("/getAllContractorList", getAllContractorList);

router.get("/getContractorsForDropDown", getContractorsForDropDown);

router.put(
  "/updateContractor/:id",
  upload.fields([
    {
      name: "billcopy",
      maxCount: 1,
    },
  ]),
  updateContractor
);

router.delete("/deleteContractor/:id", deleteContractor);

export default router;
