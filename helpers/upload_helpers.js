// viết 1 file helpers upload file lên cloudinary và trả về url của file đó
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadFileToCloud = async (file) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
                .upload_stream({ folder: "DATN" }, (error, result) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                })
                .end(file.buffer);
    });
    return result.url;
  } catch (error) {
    console.log("uploadFile error: ", error);
    return null;
  }
};

const uploadMultipleFilesToCloud = async (files) => {
  try {
    const uploadPromises = files.map((file) => uploadFileToCloud(file));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.log("uploadMultipleFiles error: ", error);
    return null;
  }
};

module.exports = { uploadFileToCloud, uploadMultipleFilesToCloud };
