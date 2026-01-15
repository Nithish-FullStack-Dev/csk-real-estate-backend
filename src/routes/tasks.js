import express from "express";
import multer from "multer";
import { ObjectId } from "mongodb";
import cloudinary from "../lib/cloudinary.js";
import clientPromise from "../lib/mongodb.js";
import { auth } from "../middlewares/auth.js";
import jwt from "jsonwebtoken";
const router = express.Router();
const upload = multer();

/* ======================================
   CREATE TASK
====================================== */
router.post("/create", upload.array("attachment"), async (req, res) => {
  try {
    const {
      title,
      description,
      assignee,
      userId, // ✅ renamed
      assigneeAvatar,
      priority,
      dueDate,
      status,
      tags,
    } = req.body;

    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];
    console.log("call", token);

    if (!token) {
      console.log("no token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!payload) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!title || !description || !priority || !dueDate || !status || !userId)
      return res.status(400).json({ error: "Missing fields" });

    const attachments = [];

    for (const file of req.files || []) {
      if (file.size > 10 * 1024 * 1024)
        return res.status(400).json({ error: "File too large" });

      const uploaded = await cloudinary.uploader.upload_stream({
        resource_type: "auto",
        folder: "kanban_attachments",
      });

      attachments.push({
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
        size: file.size,
        contentType: file.mimetype,
        originalName: file.originalname,
      });
    }

    const client = await clientPromise;
    const db = client.db();

    const task = {
      title,
      description,
      assignee,
      userId: new ObjectId(userId),
      assigneeAvatar,
      priority,
      dueDate: new Date(dueDate),
      status,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      attachments,
      createdAt: new Date(),
    };

    const result = await db.collection("tasks").insertOne(task);

    res.status(201).json({
      success: true,
      task: { ...task, _id: result.insertedId },
    });
  } catch (err) {
    console.error("CREATE TASK ERROR", err);
    res.status(500).json({ error: "Create failed" });
  }
});

/* ======================================
   FETCH TASKS
====================================== */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query; // comes from the dropdown

    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];
    console.log("call", token);

    if (!token) {
      console.log("no token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!payload) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { id, role } = payload; // comes from JWT

    const client = await clientPromise;
    const db = client.db();

    const currentUserId = new ObjectId(id);

    const where = {};

    // ADMIN can view any user's tasks
    if (role === "ADMIN") {
      if (userId) {
        where.userId = new ObjectId(userId);
      }
      // else → admin sees all tasks
    }
    // Non-admin sees only their own tasks
    else {
      where.userId = currentUserId;
    }

    const tasks = await db
      .collection("tasks")
      .aggregate([
        { $match: where },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "taskId",
            as: "comments",
          },
        },
      ])
      .toArray();

    res.json({ success: true, tasks });
  } catch (err) {
    console.error("FETCH TASK ERROR", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

/* ======================================
   UPDATE TASK
====================================== */
router.put("/", upload.array("attachment"), async (req, res) => {
  try {
    const { id, status } = req.body;

    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    console.log("call", token);

    if (!token) {
      console.log("no token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!payload) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { id: userId, role } = payload; // comes from JWT

    const client = await clientPromise;
    const db = client.db();

    const taskId = new ObjectId(id);
    const currentUserId = new ObjectId(userId);

    // Build ownership filter
    const where =
      role === "ADMIN"
        ? { _id: taskId }
        : { _id: taskId, userId: currentUserId };

    const update = {};

    if (status) update.status = status;

    if (req.files?.length) {
      const attachments = [];

      for (const file of req.files) {
        const uploaded = await cloudinary.uploader.upload(file.buffer, {
          folder: "kanban_attachments",
        });

        attachments.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
          size: file.size,
          contentType: file.mimetype,
          originalName: file.originalname,
        });
      }

      update.attachments = attachments;
    }

    const result = await db
      .collection("tasks")
      .updateOne(where, { $set: update });

    if (result.matchedCount === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE ERROR", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* ======================================
    DELETE TASK
====================================== */
router.delete("/", auth, async (req, res) => {
  try {
    const { id } = req.body;
    const { id: userId, role } = req.user;

    const client = await clientPromise;
    const db = client.db();

    const taskId = new ObjectId(id);
    const currentUserId = new ObjectId(userId);

    const where =
      role === "ADMIN"
        ? { _id: taskId }
        : { _id: taskId, userId: currentUserId };

    const result = await db.collection("tasks").deleteOne(where);

    if (result.deletedCount === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
