const cloudinary = require('../config/cloudinary');

const uploadPdfBuffer = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `synapse/summaries/${userId}`,
        resource_type: 'raw',
        format: 'pdf',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id
        });
      }
    );
    uploadStream.end(buffer);
  });
};

const deletePdfFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

module.exports = { uploadPdfBuffer, deletePdfFromCloudinary };
