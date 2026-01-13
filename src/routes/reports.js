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

/* ============================================================
   GET REPORTS FOR TASK
============================================================ */
router.get("/", async (req, res) => {
  try {
    const user = getUser(req); // optional
    const { taskId } = req.query;

    if (!taskId) return res.status(400).json({ error: "taskId required" });

    const reports = db.collection("reports");

    const messages = await reports
      .find({ taskId })
      .sort({ createdAt: -1 })
      .toArray();

    let count = 0;
    if (user) {
      count = await reports.countDocuments({
        taskId,
        reportedBy: user.userId || user.id
      });
    }

    res.json({
      success: true,
      userId: user ? user.userId || user.id : null,
      taskId,
      count,
      messages
    });

  } catch (err) {
    console.error("REPORT FETCH ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
