import express from "express";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const fileUrl = req.file.path
      .replace(process.cwd(), "")
      .replace(/\\/g, "/");

    return res.status(200).json({
      success: true,
      url: fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
