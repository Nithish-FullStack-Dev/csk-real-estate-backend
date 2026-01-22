import express from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "../lib/mongodb.js";

const router = express.Router();

/* ============================================================
   Helpers
============================================================ */
function getUserFromReq(req) {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return decoded.id || decoded.userId;
  } catch {
    return null;
  }
}

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/* ============================================================
   CREATE COMMENT
   POST /api/kanban/comment
============================================================ */
router.post("/", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!payload) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // ✅ THIS WAS MISSING (ROOT FIX)
    const { id: userId } = payload;

    const { taskId, content, username } = req.body;
    if (!taskId || !content) {
      return res.status(400).json({ error: "taskId and content are required" });
    }

    // ✅ SAFE ID VALIDATION
    if (!ObjectId.isValid(taskId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const taskObjectId = new ObjectId(taskId);
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne({ _id: userObjectId });
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }

    const comment = {
      taskId: taskObjectId,
      userId: userObjectId,
      content,
      username,
      createdAt: new Date(),
    };

    const result = await db.collection("comments").insertOne(comment);

    res.json({
      success: true,
      comment: {
        id: result.insertedId,
        content,
        createdAt: comment.createdAt,
        user: {
          id: user._id,
          name: user.name,
        },
      },
    });
  } catch (err) {
    console.error("COMMENT POST ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   GET COMMENTS FOR TASK
   GET /api/kanban/comment?taskId=xxx
============================================================ */
router.get("/", async (req, res) => {
  try {
    const { taskId } = req.query;
    if (!taskId) {
      return res.status(400).json({ error: "taskId is required" });
    }

    if (!ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid taskId" });
    }

    const taskObjectId = new ObjectId(taskId);

    const client = await clientPromise;
    const db = client.db();

    const comments = await db
      .collection("comments")
      .aggregate([
        { $match: { taskId: taskObjectId } },
        { $sort: { createdAt: 1 } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    const formatted = comments.map((c) => ({
      id: c._id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        id: c.userId,
        name: c.user?.name || "Unknown",
      },
    }));

    res.json({ success: true, comments: formatted });
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   UPDATE COMMENT (owner only)
   PUT /api/kanban/comment
============================================================ */
router.put("/", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { commentId, content } = req.body;
    if (!commentId || !content) return res.status(400).json({ success: false });

    const commentObjectId = toObjectId(commentId);
    const userObjectId = toObjectId(userId);
    if (!commentObjectId || !userObjectId)
      return res.status(400).json({ error: "Invalid ID" });

    const client = await clientPromise;
    const db = client.db();

    const result = await db
      .collection("comments")
      .updateOne(
        { _id: commentObjectId, userId: userObjectId },
        { $set: { content } }
      );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Comment not found or not owner" });

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE COMMENT ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* ============================================================
   DELETE COMMENT (owner only)
   DELETE /api/kanban/comment
============================================================ */
router.delete("/", async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { commentId } = req.body;
    if (!commentId)
      return res.status(400).json({ error: "commentId is required" });

    const commentObjectId = toObjectId(commentId);
    const userObjectId = toObjectId(userId);
    if (!commentObjectId || !userObjectId)
      return res.status(400).json({ error: "Invalid ID" });

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("comments").deleteOne({
      _id: commentObjectId,
      userId: userObjectId,
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Comment not found or not owner" });

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
