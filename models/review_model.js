const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize_helpers"); // Adjust the path to your sequelize instance
const Book = require("./book_model");
const User = require("./user_model");

const Review = sequelize.define(
  "Review",
  {
    review_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Book, key: "book_id" },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: User, key: "user_id" },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    review_images: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "reviews",
    timestamps: false,
  }
);

Review.belongsTo(Book, { foreignKey: "book_id", targetKey: "book_id" });
Review.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id" });

module.exports = Review;