import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import clientPromise from "../lib/mongodb.js";

const router = express.Router();

/* ============================================================
   AUTH HELPER
============================================================ */
function getUserFromToken(req) {
  const token =
    req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch {
    return null;
  }
}

/* ============================================================
   CREATE DEPARTMENT
============================================================ */
router.post("/create", async (req, res) => {
  try {
    const user = getUserFromToken(req);

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, labels } = req.body;

    if (!name || !Array.isArray(labels)) {
      return res.status(400).json({
        error: "Department name and labels are required",
      });
    }

    const client = await clientPromise;
    const db = client.db();

    // 🔥 sanitize labels properly
    const formattedLabels = labels.map((label) => ({
      name: label.name,
      types: (label.types || []).map((emp) => ({
        userId: new ObjectId(emp._id), // convert
        name: emp.name,
        role: emp.role,
      })),
    }));

    const department = {
      name,
      labels: formattedLabels,
      createdBy: new ObjectId(user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("departments")
      .insertOne(department);

    res.status(201).json({
      success: true,
      department: {
        ...department,
        _id: result.insertedId,
      },
    });
  } catch (err) {
    console.error("CREATE DEPARTMENT ERROR:", err);
    res.status(500).json({ error: "Create failed" });
  }
});

/* ============================================================
   UPDATE DEPARTMENT (Full Replace Strategy)
============================================================ */
router.put("/update", async (req, res) => {
  try {
    const user = getUserFromToken(req);

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id, name, labels } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid department id" });
    }

    if (!name || !Array.isArray(labels)) {
      return res.status(400).json({
        error: "Department name and labels are required",
      });
    }

    const client = await clientPromise;
    const db = client.db();

    // sanitize labels
    const formattedLabels = labels.map((label) => ({
      name: label.name,
      types: (label.types || []).map((emp) => ({
        userId: new ObjectId(emp._id),
        name: emp.name,
        role: emp.role,
      })),
    }));

    const updateDoc = {
      name,
      labels: formattedLabels,
      updatedAt: new Date(),
    };

    const result = await db.collection("departments").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    const updatedDepartment = await db
      .collection("departments")
      .findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      department: updatedDepartment,
    });

  } catch (err) {
    console.error("UPDATE DEPARTMENT ERROR:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* ============================================================
   GET ALL DEPARTMENTS
============================================================ */
router.get("/", async (req, res) => {
  try {
    const user = getUserFromToken(req);

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db();

    const departments = await db
      .collection("departments")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      departments,
    });
  } catch (err) {
    console.error("FETCH DEPARTMENT ERROR:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

/* ============================================================
   DELETE DEPARTMENT
============================================================ */
router.delete("/", async (req, res) => {
  try {
    const user = getUserFromToken(req);

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("departments").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE DEPARTMENT ERROR:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;