const { DataTypes } = require("sequelize");
const sequelizeHelpers = require("../helpers/sequelize_helpers");
const { avatarDefault } = require("../constants/common");
const AddressDetail = require("./address_detail_model"); // Import the AddressDetail model

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
      defaultValue: avatarDefault,
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
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    role: {
      type: DataTypes.ENUM,
      values: ["user", "admin", "member"],
      defaultValue: "user",
    },
    sex: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    default_address: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: AddressDetail,
        key: "address_id",
      },
    },
    is_block: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);

User.belongsTo(AddressDetail, {
  foreignKey: "default_address",
  as: "defaultAddressDetail",
});

module.exports = User;
