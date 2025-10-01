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
  getLoggedInUser,
} from "../controller/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import csrf from "csurf";
import { tokenBlacklist } from "../utils/tokenBlacklist.js";

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

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

router.post("/logout", authenticate, (req, res) => {
  const { token } = req.cookies;
  if (token) {
    tokenBlacklist.add(token); // Add this
  }
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;
