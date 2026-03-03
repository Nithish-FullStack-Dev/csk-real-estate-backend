import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// recreate __dirname (ESM safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads folder
const baseUploadDir = path.join(__dirname, "..", "uploads");

// Ensure base folder exists
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    if (file.mimetype.startsWith("image/")) {
      folder = "images";
    } else if (file.mimetype === "application/pdf") {
      folder = "pdfs";
    }

    const finalPath = path.join(baseUploadDir, folder);

    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);

    cb(null, uniqueSuffix + ext);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, 
  },
});
