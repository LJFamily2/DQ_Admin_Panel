const fs = require('fs').promises;
const path = require('path');

const deleteImageFile = async (image) => {
  try {
    await fs.unlink(path.join("public/images", image));
  } catch (err) {
    console.log("Error deleting image file:", err);
  }
};

module.exports = deleteImageFile;
