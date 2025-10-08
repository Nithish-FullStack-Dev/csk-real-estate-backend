export const uploadFile = async (path, fieldName) => {
  const result = await uploadOnCloudniary(path);
  if (!result?.url) throw new ApiError(500, `${fieldName} upload failed`);
  return result.url;
};
