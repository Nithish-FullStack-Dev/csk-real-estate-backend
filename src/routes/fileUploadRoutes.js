import express from "express";
import { upload } from "../middlewares/multer.js"; // your multer middleware
import { uploadOnCloudniary } from "../config/cloudinary.js"; // your utility

const router = express.Router();

// Single file upload API
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const localFilePath = req.file?.path;

    if (!localFilePath) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const cloudinaryUrl = await uploadOnCloudniary(localFilePath);

    if (!cloudinaryUrl) {
      return res.status(500).json({ error: "Cloudinary upload failed." });
    }

    return res.status(200).json({ url: cloudinaryUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
