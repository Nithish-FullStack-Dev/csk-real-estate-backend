import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { db } from "../config/dbnative.js";

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

    const client = await clientPromise;
    const db = client.db();

    // Count reports by current user
    const count = userId
      ? await db.collection("reports").countDocuments({
          taskId: new ObjectId(taskId),
          reportedBy: new ObjectId(userId)
        })
      : 0;

    // Fetch all messages for task
    const messages = await db.collection("reports")
      .find({ taskId: new ObjectId(taskId) })
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
