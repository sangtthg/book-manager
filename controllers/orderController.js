const db = require("../helpers/db_helpers");
const { CartDetail } = require("../models");

exports.createOrder = async (req, res) => {
  try {
    const user_id = req.auth.user_id;

    const carts = await CartDetail.findAll({
      where: {
        user_id,
      },
    });
    console.log(carts, "crt");

    return res.json({ status: "0" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error creating order");
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await db.orders.findAll({
      include: db.books,
    });

    res.json({ orders, code: 0, message: "Thành công!" });
  } catch (error) {
    res.status(500).send("Error fetching orders");
  }
};
exports.updateStatus = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({
      message: "Hệ thống bận!",
      code: -1,
    });
  }
};
