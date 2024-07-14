var express = require("express");
var path = require("path");
var router = express.Router();
const login = path.join(__dirname, "../views/login.html");
router.get("/", function (req, res, next) {
  res.sendFile(login);
});

router.post("/api/admin/login", function (req, res) {
  const { email, password } = req.body;

  if (email === "admin@gmail.com" && password === "password") {
    req.session.user = { email };
    res.json({ status: "1" });
  } else {
    res.json({ status: "0" });
  }
});
module.exports = router;
