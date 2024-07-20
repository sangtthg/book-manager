var express = require("express");
var router = express.Router();

var path = require("path");
const login = path.join(__dirname, "../views/login.ejs");
const home = path.join(__dirname, "../views/home.ejs");
const ListProduct = path.join(__dirname, "../views/ListProduct.ejs");
const Account = path.join(__dirname, "../views/Account.ejs");
const Catelogy = path.join(__dirname, "../views/Catelogy.ejs");
const Author = path.join(__dirname, "../views/Author.ejs");
const User = path.join(__dirname, "../views/User.ejs");
const Member = path.join(__dirname, "../views/Member.ejs");
const Cart = path.join(__dirname, "../views/Cart.ejs");

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

router.get("/Category", function (req, res, next) {
  res.render(Catelogy);
});
router.get("/Author", function (req, res, next) {
  res.render(Author);
});
router.get("/User", function (req, res, next) {
  res.render(User);
});
router.get("/Member", function (req, res, next) {
  res.render(Member);
});
router.get("/Cart", function (req, res, next) {
  res.render(Cart);
});
module.exports = router;
