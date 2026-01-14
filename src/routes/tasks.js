import express from "express";
import multer from "multer";
import { ObjectId } from "mongodb";
import cloudinary from "../lib/cloudinary.js";
import clientPromise from "../lib/mongodb.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();
const upload = multer();

/* ======================================
   CREATE TASK
====================================== */
router.post("/", auth, upload.array("attachment"), async (req, res) => {
  try {
    const {
      title,
      description,
      assignee,
      employeeId,
      assigneeAvatar,
      priority,
      dueDate,
      status,
      projectId,
      tags
    } = req.body;

    if (!title || !description || !priority || !dueDate || !status)
      return res.status(400).json({ error: "Missing fields" });

    const attachments = [];

    for (const file of req.files || []) {
      if (file.size > 10 * 1024 * 1024)
        return res.status(400).json({ error: "File too large" });

      const uploaded = await cloudinary.uploader.upload_stream({
        resource_type: "auto",
        folder: "kanban_attachments"
      });

      attachments.push({
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
        size: file.size,
        contentType: file.mimetype,
        originalName: file.originalname
      });
    }

    const client = await clientPromise;
    const db = client.db();

    const task = {
      title,
      description,
      assignee,
      employeeId,
      assigneeAvatar,
      priority,
      dueDate: new Date(dueDate),
      status,
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      attachments,
      projectId: projectId ? new ObjectId(projectId) : null,
      createdAt: new Date()
    };

    const result = await db.collection("tasks").insertOne(task);

    res.status(201).json({ success: true, task: { ...task, _id: result.insertedId } });

  } catch (err) {
    console.error("CREATE TASK ERROR", err);
    res.status(500).json({ error: "Create failed" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const { projectId, employeeId } = req.query;
    const { id, role } = req.user;

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });

    let where = {};
    if (projectId) where.projectId = new ObjectId(projectId);

    if (role === "ADMIN") {
      where.employeeId = employeeId || user.employeeId;
    } else {
      where.employeeId = user.employeeId;
    }

    const tasks = await db.collection("tasks")
      .aggregate([
        { $match: where },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project"
          }
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "taskId",
            as: "comments"
          }
        }
      ])
      .toArray();

    res.json({ success: true, tasks });

  } catch (err) {
    console.error("FETCH TASK ERROR", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

router.put("/", auth, upload.array("attachment"), async (req, res) => {
  try {
    const { id, status } = req.body;
    const client = await clientPromise;
    const db = client.db();

    const update = {};

    if (status) update.status = status;

    if (req.files?.length) {
      const attachments = [];
      for (const file of req.files) {
        const uploaded = await cloudinary.uploader.upload(file.buffer, {
          folder: "kanban_attachments"
        });

        attachments.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
          size: file.size,
          contentType: file.mimetype,
          originalName: file.originalname
        });
      }
      update.attachments = attachments;
    }

    await db.collection("tasks").updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UPDATE ERROR", err);
    res.status(500).json({ error: "Update failed" });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    const { id } = req.body;

    const client = await clientPromise;
    const db = client.db();

    await db.collection("tasks").deleteOne({ _id: new ObjectId(id) });

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE ERROR", err);
    res.status(500).json({ error: "Delete failed" });
  }
});
