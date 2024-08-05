const { DataTypes } = require("sequelize");
const User = require("./user_model");
const sequelizeHelpers = require("../helpers/sequelize_helpers");
const Author = sequelizeHelpers.define(
  "Author",
  {
    author_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    author_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    tableName: "authors",
    timestamps: false,
  }
);

module.exports = Author;
