var express = require("express");
var router = express.Router();

var path = require("path");
const {
  listOrders,
  listAllOrders,
  updateStatus,
} = require("../controllers/orderController");
const reviewController = require("../controllers/reviewsController");
const login = path.join(__dirname, "../views/login.ejs");
const home = path.join(__dirname, "../views/home.ejs");
const ListProduct = path.join(__dirname, "../views/ListProduct.ejs");
const Account = path.join(__dirname, "../views/Account.ejs");
const Catelogy = path.join(__dirname, "../views/Catelogy.ejs");
const Author = path.join(__dirname, "../views/Author.ejs");
const User = path.join(__dirname, "../views/User.ejs");
const Member = path.join(__dirname, "../views/Member.ejs");
const Cart = path.join(__dirname, "../views/Cart.ejs");
const order = path.join(__dirname, "../views/orders.ejs");
const reviews = path.join(__dirname, "../views/reviews.ejs");
const addBook = path.join(__dirname, "../views/addBook.ejs");
const updateBook = path.join(__dirname, "../views/updateBook.ejs");
const detailBook = path.join(__dirname, "../views/Detail_Book.ejs");

// router.get("/home/:id", function (req, res, next) {
//   const bookId = req.params.id;
//   res.render("detailBook", { bookId });
// });
router.get("/order", function (req, res, next) {
  res.render(order);
});
router.get("/orders", listAllOrders);
router.post("/update-status", updateStatus);

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
router.get("/reviews", (req, res) => {
  res.render(reviews);
});
router.get("/addbook", (req, res) => {
  res.render(addBook);
});
router.get("/updatebook/:id", (req, res) => {
  const bookId = req.params.id;
  res.render("updateBook", { bookId });
});
router.get("/DetailBook/:id", (req, res) => {
  const bookId = req.params.id;
  res.render("Detail_Book", { bookId });
});

module.exports = router;
