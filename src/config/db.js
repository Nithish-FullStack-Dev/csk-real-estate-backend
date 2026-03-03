import mongoose from "mongoose";
import dotenv from "dotenv";
import { startStream, stopStream } from "../lib/changeStream.js";

dotenv.config();

const mongodb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    // Start the audit change stream once the connection is confirmed ready.
    await startStream();

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn(
        "MongoDB disconnected — audit stream will auto-restart on reconnect",
      );
    });

    mongoose.connection.on("reconnected", async () => {
      console.log("MongoDB reconnected — restarting audit stream");
      await startStream();
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Graceful shutdown — prevents zombie streams on SIGINT / SIGTERM
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down audit stream…`);
  await stopStream();
  await mongoose.connection.close();
  process.exit(0);
};

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default mongodb;
