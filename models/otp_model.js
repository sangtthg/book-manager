const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize_helpers"); // Adjust the path to your sequelize instance
const OtpTypes = require("../constants/otp_type");

const Otp = sequelize.define(
  "Otp",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    type: {
      type: DataTypes.ENUM,
      values: [
        OtpTypes.REGISTER,
        OtpTypes.CHANGE_PASSWORD,
        OtpTypes.FORGOT_PASSWORD,
      ],
      allowNull: true,
      defaultValue: OtpTypes.REGISTER,
    },
  },
  {
    tableName: "otps",
    timestamps: false, // Custom timestamp fields are being used
  }
);

module.exports = Otp;
