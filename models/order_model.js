// models/order_model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize_helpers");

const Order = sequelize.define(
  "Order",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // cartId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // status: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    // },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    orderStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    voucherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    discountPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    items: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    statusShip: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    listCartId: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    payDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "Orders",
  }
);
module.exports = Order;