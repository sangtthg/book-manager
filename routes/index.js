var express = require("express");
var path = require("path");
var router = express.Router();
const login = path.join(__dirname, "../views/login.html");
router.get("/", function (req, res, next) {
  res.sendFile(login);
});

module.exports = router;
