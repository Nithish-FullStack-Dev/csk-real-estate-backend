import express from "express";
import { ObjectId } from "mongodb";
import clientPromise from "../lib/mongodb.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

/* ======================================
   DELETE SINGLE TASK
   DELETE /api/task/:id
====================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const client = await clientPromise;
    const db = client.db();

    const taskId = new ObjectId(id);

    const existingTask = await db.collection("tasks").findOne({
      _id: taskId,
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    await db.collection("tasks").deleteOne({ _id: taskId });

    res.json({
      message: "Task deleted successfully",
      deletedTask: existingTask,
    });
  } catch (err) {
    console.error("DELETE TASK ERROR:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});


export default router;
