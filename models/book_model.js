const { DataTypes } = require("sequelize");
const Category = require("./category_model");
const Author = require("./author_model");
const sequelizeHelpers = require("../helpers/sequelize_helpers");

const Book = sequelizeHelpers.define(
  "Book",
  {
    book_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Author, key: "author_id" },
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Category, key: "category_id" },
    },
    publication_year: { type: DataTypes.INTEGER, allowNull: true },
    book_avatar: { type: DataTypes.STRING(255), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    views_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    purchase_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    old_price: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
    new_price: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
    used_books: { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
  },
  { tableName: "books", timestamps: false }
);

module.exports = Book;
