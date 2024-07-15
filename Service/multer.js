const multer = require("multer");

module.exports.storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    if (!file.originalname) {
      return;
    }
    let fileName = file.originalname;
    let arr = fileName.split(".");
    let newFileName = arr[0] + "-" + Date.now() + "." + arr[1];
    cb(null, newFileName);
  },
});
