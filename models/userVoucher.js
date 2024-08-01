// models/userVoucher.js
const { DataTypes } = require("sequelize");
const sequelizeHelpers = require("../helpers/sequelize_helpers");

const UserVoucher = sequelizeHelpers.define(
  "UserVoucher",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    voucherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "user_vouchers",
    timestamps: true,
  }
);

module.exports = UserVoucher;