// middlewares/multerCsv.js
import multer from "multer";

const storage = multer.memoryStorage();

export const uploadCsv = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files allowed"));
    }
  },
});
