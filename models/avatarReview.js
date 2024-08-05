const { DataTypes } = require("sequelize");
const sequelizeHelpers = require("../helpers/sequelize_helpers");
const Book = require("./book_model");

const AvatarReview = sequelizeHelpers.define(
  "AvatarReview",
  {
    avatar_review_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Book,
        key: "book_id",
      },
    },

    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "avatar_reviews",
    timestamps: false,
  }
);

module.exports = AvatarReview;
