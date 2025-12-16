import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudniary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
      folder: "csk/images",
      format: "webp",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    // ✅ Delete temp file after successful upload
    fs.unlinkSync(localFilePath);

    return response.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);

    // ✅ Try to delete the temp file even on failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export const uploadPdfToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw",
      folder: "csk/pdfs",
      format: "pdf",
      access_mode: "public",
    });
    fs.unlinkSync(localFilePath);
    return response.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);

    // ✅ Try to delete the temp file even on failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};
