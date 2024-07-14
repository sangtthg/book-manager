const { DataTypes } = require("sequelize");
const User = require("./user_model");
const sequelizeHelpers = require("../helpers/sequelize_helpers");

const Category = sequelizeHelpers.define(
  "Category",
  {
    category_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "user_id",
      },
    },
  },
  {
    tableName: "categories",
    timestamps: false, // because you don't have any timestamp fields
  }
);

module.exports = Category;
