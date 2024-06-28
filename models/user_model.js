const { DataTypes } = require("sequelize");
const sequelizeHelpers = require("../helpers/sequelize_helpers");
const User = sequelizeHelpers.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      defaultValue: "uploads/default_avatar.png",
    },
    auth_token: {
      type: DataTypes.STRING(100),
      defaultValue: "",
    },
    reset_code: {
      type: DataTypes.STRING(6),
      defaultValue: "0000",
    },
    user_status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "1: active, 2: block",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM,
      values: ["user", "admin", "member"],
      defaultValue: "user",
    },
  },
  {
    tableName: "users",
    timestamps: false, // because you have custom field names for timestamps
  }
);

module.exports = User;
