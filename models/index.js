// models/index.js
const sequelize = require("../helpers/sequelize_helpers");
const Order = require("./order_model");
const CartDetail = require("./cart_detail_model");
const VnpayTransaction = require("./VnpayTransaction");
const PaymentTransaction = require("./PaymentTransaction");
const User = require("./user_model");
const Review = require("./reviews.model");
const Book = require("./book_model");
const Notification = require("./NotificationModel");
const db = {
  sequelize,
  Order,
  CartDetail,
  VnpayTransaction,
  PaymentTransaction,
  User,
  Review,
  Book,
  Notification,
};

module.exports = db;