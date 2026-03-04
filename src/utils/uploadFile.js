// src/utils/uploadFile.js

import fs from "fs";
import ApiError from "./ApiError.js";

export const uploadFile = async (path) => {
  if (!path) {
    throw new ApiError(400, "File path missing");
  }

  // ensure file exists
  if (!fs.existsSync(path)) {
    throw new ApiError(404, "Uploaded file not found");
  }

  // convert absolute path → relative path
  const fileUrl = path.replace(process.cwd(), "").replace(/\\/g, "/");

  return fileUrl;
};
