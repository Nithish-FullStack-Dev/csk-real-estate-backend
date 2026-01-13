import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const getAll = searchParams.get("all");

    const client = await clientPromise;
    const db = client.db(); // default DB
    const usersCol = db.collection("users");

    /* ===============================
       ADMIN: GET ALL USERS
    =============================== */
    if (getAll === "true") {
      const users = await usersCol
        .find({}, {
          projection: {
            password: 0, // never send password
          }
        })
        .sort({ name: 1 })
        .toArray();

      return NextResponse.json({ success: true, users });
    }

    /* ===============================
       AUTHENTICATED USER
    =============================== */
    const token = cookies().get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = payload.userId || payload.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const user = await usersCol.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("USER API ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
