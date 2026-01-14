import express from "express";
import { ObjectId } from "mongodb";
import clientPromise from "../lib/mongodb.js";

const router = express.Router();

/* ======================================
   GET REPORT COUNT BY USER & TASK
   GET /api/kanban/report/count?taskId=xxx&userId=yyy
====================================== */
router.get("/count", async (req, res) => {
  try {
    const { taskId, userId } = req.query;

    if (!taskId || !userId) {
      return res.status(400).json({
        error: "taskId and userId required"
      });
    }

    const client = await clientPromise;
    const db = client.db();

    const count = await db.collection("reports").countDocuments({
      taskId: new ObjectId(taskId),
      reportedBy: new ObjectId(userId)
    });

    res.json({ count });

  } catch (err) {
    console.error("COUNT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
