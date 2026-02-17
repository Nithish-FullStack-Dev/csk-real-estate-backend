// src\utils\uploadFile.js
import { uploadOnCloudniary } from "../config/cloudinary.js";
import ApiError from "./ApiError.js";

export const uploadFile = async (path, folder, isBrochure = false) => {
  const result = await uploadOnCloudniary(path, {
    folder: `csk/${folder}`,
    resource_type: isBrochure ? "raw" : "image",
  });

  if (!result) throw new ApiError(500, `${folder} upload failed`);

  return result.secure_url;
};
