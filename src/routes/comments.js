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
   CREATE COMMENT
============================================================ */
router.post("/", async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { taskId, content } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({ error: "taskId and content required" });
    }

    const users = db.collection("users");
    const comments = db.collection("comments");

    const me = await users.findOne({ _id: new ObjectId(user.userId || user.id) });

    if (!me) return res.status(401).json({ error: "Invalid user" });

    const comment = {
      taskId,
      userId: me._id.toString(),
      content,
      createdAt: new Date()
    };

    const result = await comments.insertOne(comment);

    res.json({
      success: true,
      comment: {
        id: result.insertedId,
        content,
        createdAt: comment.createdAt,
        authorId: me._id.toString(),
        author: me.name,
        avatar: me.name
          .split(" ")
          .map(n => n[0])
          .join("")
          .toUpperCase()
      }
    });

  } catch (err) {
    console.error("COMMENT CREATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   GET COMMENTS FOR TASK
============================================================ */
router.get("/", async (req, res) => {
  try {
    const { taskId } = req.query;

    if (!taskId) return res.status(400).json({ error: "taskId required" });

    const comments = await db
      .collection("comments")
      .find({ taskId })
      .sort({ createdAt: 1 })
      .toArray();

    const users = db.collection("users");

    const formatted = [];

    for (const c of comments) {
      const u = await users.findOne({ _id: new ObjectId(c.userId) });

      formatted.push({
        id: c._id,
        content: c.content,
        createdAt: c.createdAt,
        userId: c.userId,
        authorId: c.userId,
        author: u?.name || "Unknown",
        avatar: u?.name
          ? u.name.split(" ").map(n => n[0]).join("").toUpperCase()
          : "?"
      });
    }

    res.json({ success: true, comments: formatted });

  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   DELETE COMMENT
============================================================ */
router.delete("/", async (req, res) => {
  try {
    const { commentId } = req.body;

    if (!commentId) return res.status(400).json({ error: "commentId required" });

    await db.collection("comments").deleteOne({
      _id: new ObjectId(commentId)
    });

    res.json({ success: true, message: "Comment deleted" });

  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ============================================================
   UPDATE COMMENT
============================================================ */
router.put("/", async (req, res) => {
  try {
    const { commentId, content } = req.body;

    if (!commentId || !content) {
      return res.status(400).json({ success: false });
    }

    await db.collection("comments").updateOne(
      { _id: new ObjectId(commentId) },
      { $set: { content } }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UPDATE COMMENT ERROR:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
