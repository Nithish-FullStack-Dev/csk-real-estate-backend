import mongoose from "mongoose";
import dotenv from "dotenv";
import startStream from "../lib/changeStream.js";

dotenv.config();

const mongodb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    startStream();

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
};

export default mongodb;
