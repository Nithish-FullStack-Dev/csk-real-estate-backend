import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/dbnative.js";
import {authOptional} from "../middlewares/authOptional.js";

const router = express.Router();

/* ======================================
   GET REPORTS FOR A TASK
   GET /api/kanban/report?taskId=xxxx
====================================== */
router.get("/", authOptional, async (req, res) => {
  try {
    const { taskId } = req.query;
    const userId = req.user?.id || null;

    if (!taskId) {
      return res.status(400).json({ error: "taskId is required" });
    }

    const taskObjectId = new ObjectId(taskId);

    const count = userId
      ? await db.collection("reports").countDocuments({
          taskId: taskObjectId,
          reportedBy: userId
        })
      : 0;

    const messages = await db
      .collection("reports")
      .find({ taskId: taskObjectId })
      .project({ message: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      userId,
      taskId,
      count,
      messages
    });
  } catch (err) {
    console.error("Report fetch error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


export default router;
