import express from "express";
import User from "../modals/user.js";
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
  getContractors,
} from "../controller/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import csrf from "csurf";

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
router.get("/getControctorsForDropDown", getContractors);
router.patch("/:id/status", updateStatus);
router.get("/site-incharges", getSiteIncharges);
router.get("/contractor", getAllContractors);
router.get("/getAllSales", getAllSalesPersons);
router.get("/getAllAgents", getAllAgentPersons);
router.get("/getAllcustomer_purchased", getAllCustomer_Purchased);

router.post("/logout", authenticate, async (req, res) => {
  try {
    const { token, secure_access } = req.cookies;

    await User.findByIdAndUpdate(req.user._id, { currentToken: null });

    res.clearCookie("token", {
      httpOnly: true,
      secure: true, // HTTPS only
      sameSite: "lax", // best default
      path: "/",
    });

    if (secure_access) {
      res.clearCookie("secure_access", {
        httpOnly: true,
        secure: true, // HTTPS only
        sameSite: "lax", // best default
        path: "/",
      });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
