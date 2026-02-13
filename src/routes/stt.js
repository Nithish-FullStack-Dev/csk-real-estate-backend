import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));

    const response = await axios.post(
      "http://localhost:8001/transcribe",
      form,
      { headers: form.getHeaders() }
    );

    fs.unlinkSync(req.file.path);

    res.json({ text: response.data.text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "STT failed" });
  }
});

export default router;