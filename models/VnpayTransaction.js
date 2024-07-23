// models/VnpayTransaction.js
const { DataTypes } = require('sequelize');
const sequelize = require('../helpers/sequelize_helpers');

const VnpayTransaction = sequelize.define('VnpayTransaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  order: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  payRefundStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expAt: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  payUrl: {
    type: DataTypes.STRING(10000),
    allowNull: true,
  },
  requestData: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'VnpayTransaction',
  timestamps: true,
});

module.exports = VnpayTransaction;