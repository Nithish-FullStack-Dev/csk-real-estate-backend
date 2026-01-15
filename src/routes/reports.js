import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { db } from "../config/dbnative.js";

const router = express.Router();

/* ============================================================
   AUTH HELPER
============================================================ */
function getUser(req) {
  const token =
    req.cookies.token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

/* ============================================================
   CREATE REPORT
============================================================ */
router.post("/", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { message, taskId } = req.body;

    if (!message || !taskId) {
      return res.status(400).json({ error: "Message & taskId required" });
    }

    const report = {
      taskId,
      message,
      reportedBy: user.userId || user.id,
      createdAt: new Date()
    };

    const result = await db.collection("reports").insertOne(report);

    res.json({
      success: true,
      report: { ...report, id: result.insertedId }
    });

  } catch (err) {
    console.error("REPORT CREATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
