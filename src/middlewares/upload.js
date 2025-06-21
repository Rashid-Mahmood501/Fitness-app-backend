const multer = require("multer");
const { imageStorage, videoStorage } = require("../utils/cloudinary");

const imageUpload = multer({ storage: imageStorage });
const videoUpload = multer({ storage: videoStorage });

module.exports = { imageUpload, videoUpload };
