const { DataTypes } = require("sequelize");
const User = require("./user_model");
const Book = require("./book_model");
const sequelizeHelpers = require("../helpers/sequelize_helpers");

const CartDetail = sequelizeHelpers.define(
    "CartDetail",
    {
        cart_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: User, key: "user_id" },
        },
        book_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Book, key: "book_id" },
        },
        quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        modify_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        book_title_in_cart: { type: DataTypes.STRING(255), allowNull: false },
    },
    { tableName: "cart_detail", timestamps: false }
);

CartDetail.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id" });
CartDetail.belongsTo(Book, { foreignKey: "book_id", targetKey: "book_id" });

module.exports = CartDetail;
