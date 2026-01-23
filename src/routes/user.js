import express from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "../lib/mongodb.js";

const router = express.Router();

/* ===========================
   JWT VERIFY
=========================== */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
}

/* ===========================
   GET USER OR ALL USERS
   GET /api/loginuser
   GET /api/loginuser?all=true
=========================== */
router.get("/", async (req, res) => {
  try {
    const getAll = req.query.all;

    const client = await clientPromise;
    const db = client.db();
    const usersCol = db.collection("users");

    /* ===============================
       ADMIN: GET ALL USERS
    =============================== */
    if (getAll === "true") {
      const users = await usersCol
        .aggregate([
          { $project: { password: 0 } },
          {
            $lookup: {
              from: "tasks",
              localField: "_id",
              foreignField: "userId",
              as: "tasks",
            },
          },
          { $sort: { name: 1 } },
        ])
        .toArray();

      return res.json({ success: true, users });
    }

    /* ===============================
       AUTHENTICATED USER
    =============================== */
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = payload.userId || payload.id;
    const userObjectId = new ObjectId(userId);

    const result = await usersCol
      .aggregate([
        { $match: { _id: userObjectId } },
        { $project: { password: 0 } },
        {
          $lookup: {
            from: "tasks",
            localField: "_id",
            foreignField: "userId",
            as: "tasks",
          },
        },
      ])
      .toArray();

    if (!result.length) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: result[0] });
  } catch (err) {
    console.error("USER API ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
