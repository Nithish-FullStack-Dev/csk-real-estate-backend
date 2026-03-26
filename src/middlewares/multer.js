// src/middlewares/multer.js
import multer from "multer";
import fs from "fs";
import path from "path";

// Root uploads folder (outside src)
const rootUploadPath = "/app/uploads";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "images";

    if (file.mimetype === "application/pdf") {
      folder = "pdfs";
    }

    const finalPath = path.join(rootUploadPath, folder);

    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});
