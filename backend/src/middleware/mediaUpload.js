const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (buffer, mimetype, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: mimetype?.startsWith('video/') || mimetype?.startsWith('audio/') ? 'video' : 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = {
  upload,
  uploadToCloudinary
};
