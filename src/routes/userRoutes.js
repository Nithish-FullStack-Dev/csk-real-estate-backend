import express from "express";
import {
  createUser,
  getAllUsers,
  getUserWithRole,
  loginUser,
  resetPassword,
  updateUser,
  deleteUser,
  getAllContractors,
  updateStatus,
  getSiteIncharges,
  getAllSalesPersons,
  getAllAgentPersons,
  getAllCustomer_Purchased,
} from "../controller/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { getLoggedInUser } from "../../../../../real-estate/src/controller/userController.js";

const router = express.Router();

router.post("/addUser", createUser);
router.get("/getUsers", authenticate, getAllUsers);
router.get("/getLoggedInUser", authenticate, getLoggedInUser);
router.get("/getRole/:userId", getUserWithRole);
router.post("/login", loginUser);
router.post("/updateUser", updateUser);
router.post("/resetPassword", resetPassword);
router.delete("/deleteUser/:userId", deleteUser);
router.get("/contractors", getAllContractors);
router.patch("/:id/status", updateStatus);
router.get("/site-incharges", getSiteIncharges);
router.get("/contractor", getAllContractors);
router.get("/getAllSales", getAllSalesPersons);
router.get("/getAllAgents", getAllAgentPersons);
router.get("/getAllcustomer_purchased", getAllCustomer_Purchased);

export default router;
