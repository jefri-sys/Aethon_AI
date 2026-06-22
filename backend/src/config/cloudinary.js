const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadCareerDocToCloudinary = (buffer, originalname, mimetype) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "synapse/career-vault",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          cloudinaryUrl: result.secure_url,
          publicId: result.public_id
        });
      }
    );
    uploadStream.end(buffer);
  });
};

cloudinary.uploadCareerDocToCloudinary = uploadCareerDocToCloudinary;

module.exports = cloudinary;
