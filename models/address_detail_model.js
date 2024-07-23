const { DataTypes } = require("sequelize");
const sequelizeHelpers = require("../helpers/sequelize_helpers");

const AddressDetail = sequelizeHelpers.define(
    "AddressDetail",
    {
        address_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "",
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "",
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        address_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "",
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    { tableName: "address_detail", timestamps: false }
);

module.exports = AddressDetail;
