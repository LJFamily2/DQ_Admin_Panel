const path = require("path");
const multer = require("multer");
const shortid = require("shortid");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const uniqueIdentifier = shortid.generate();
    const randomValue = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname);
    const uniqueFilename = `${uniqueIdentifier}_${randomValue}${extension}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
});

module.exports = upload;
