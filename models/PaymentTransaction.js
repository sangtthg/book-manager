// models/PaymentTransaction.js
const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize_helpers");
const PaymentTransaction = sequelize.define("PaymentTransaction", {
  totalAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  discountMoney: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalMoneyAfterDiscount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalDiscount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.ENUM,
    values: ["cash", "banking", "swipe"],
    allowNull: true,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM,
    values: ["pending", "fail", "success"],
    defaultValue: "pending",
  },
});

module.exports = PaymentTransaction;
