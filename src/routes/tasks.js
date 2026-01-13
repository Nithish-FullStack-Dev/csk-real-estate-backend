import express from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
import { db } from "../config/dbnative.js";
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

    if (!title || !description || !priority || !dueDate || !status) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const attachments = [];

    for (const file of req.files) {
      if (file.size > 10 * 1024 * 1024)
        return res.status(400).json({ error: "File too large" });

      const upload = await cloudinary.uploader.upload(file.buffer, {
        resource_type: "auto",
        folder: "kanban_attachments"
      });

      attachments.push({
        url: upload.secure_url,
        public_id: upload.public_id,
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype
      });
    }

    const task = {
      title,
      description,
      assignee,
      employeeId,
      assigneeAvatar,
      priority,
      status,
      dueDate: new Date(dueDate),
      tags: tags ? tags.split(",") : [],
      attachments,
      projectId: projectId || null,
      createdAt: new Date()
    };

    const result = await db.collection("tasks").insertOne(task);

    res.json({ success: true, task: { ...task, id: result.insertedId } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Create failed" });
  }
});
export default router;