// models/index.js
const sequelize = require('../helpers/sequelize_helpers');
const Order = require('./order_model');
const CartDetail = require('./cart_detail_model');
const VnpayTransaction = require('./VnpayTransaction');
const PaymentTransaction = require('./PaymentTransaction');
const db = {
  sequelize,
  Order,
  CartDetail,
  VnpayTransaction,
  PaymentTransaction
};

module.exports = db;
