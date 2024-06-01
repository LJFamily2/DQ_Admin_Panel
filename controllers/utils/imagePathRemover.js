const fs = require('fs').promises;
const path = require('path');

const deleteImageFile = async (image) => {
  try {
    const imagePath = path.join("public", image);
    await fs.unlink(imagePath);
    console.log(`Deleted image file: ${imagePath}`);
  } catch (err) {
    console.log("Error deleting image file:", err);
  }
};

module.exports = deleteImageFile;
