var express = require("express");
var router = express.Router();
var path = require("path");
const home = path.join(__dirname, "../views/home.html");

router.get("/home", function (req, res, next) {
  res.render(home, { title: "home" });
});

module.exports = router;
