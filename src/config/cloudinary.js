import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudniary = async (localFilePath, options = {}) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: options.resource_type || "image",
      folder: options.folder || "csk/images",
      ...options,
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return null;
  }
};

/* PDF upload */
export const uploadPdfToCloudinary = async (localFilePath, originalName) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw",
      folder: "csk/pdfs",
      use_filename: true,
      unique_filename: true,
    });

    fs.unlinkSync(localFilePath);
    return response.secure_url;
  } catch (error) {
    console.error("Cloudinary PDF upload failed:", error);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return null;
  }
};
