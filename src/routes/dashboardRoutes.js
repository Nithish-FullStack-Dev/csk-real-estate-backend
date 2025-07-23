// Express.js backend (routes/stats.js)
import express from "express";
import User from "../modals/user.js"; // your Mongoose User model
import { authenticate,authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/admin",authenticate,authorizeRoles("admin"),async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const adminUsers = await User.countDocuments({ role: "admin" });

    res.json({
      totalUsers,
      newUsers,
      adminUsers,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
