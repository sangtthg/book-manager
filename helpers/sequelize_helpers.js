// database.js
const { Sequelize } = require("sequelize");

const sequelizeHelpers = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    timezone: process.env.DB_TIMEZONE,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      charset: process.env.DB_CHARSET,
      dialectOptions: {
        collate: "utf8_general_ci",
      },
    },
  }
);
module.exports = sequelizeHelpers;
