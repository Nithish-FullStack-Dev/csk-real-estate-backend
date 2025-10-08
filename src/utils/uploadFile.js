import { uploadOnCloudniary } from "../config/cloudinary.js";
import ApiError from "./ApiError.js";

export const uploadFile = async (path, fieldName) => {
  const result = await uploadOnCloudniary(path);
  if (!result) throw new ApiError(500, `${fieldName} upload failed`);
  return result;
};
