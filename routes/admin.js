var express = require("express");
var router = express.Router();
var path = require("path");
const login = path.join(__dirname, "../views/login.ejs");
const home = path.join(__dirname, "../views/home.ejs");
const ListProduct = path.join(__dirname, "../views/ListProduct.ejs");
const Account = path.join(__dirname, "../views/Account.ejs");
const Catelogy = path.join(__dirname, "../views/Catelogy.ejs");

router.get("/home", function (req, res, next) {
  res.render(home);
});

router.get("/", function (req, res, next) {
  res.render(login);
});
router.get("/ListProduct", function (req, res, next) {
  res.render(ListProduct);
});
router.get("/Account", function (req, res, next) {
  res.render(Account);
});

router.get("/Catelogy", function (req, res, next) {
  console.log("cabscacakjhbckajsbk");
  res.render(Catelogy);
});
module.exports = router;
