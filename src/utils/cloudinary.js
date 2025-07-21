const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads/images",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "avif", "gif"],
  },
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi"],
  },
});

module.exports = { cloudinary, imageStorage, videoStorage };
