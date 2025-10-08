export const getFilePath = (files, key) => {
  if (files && Array.isArray(files[key]) && files[key].length) {
    return files[key][0].path;
  }
  return null;
};
