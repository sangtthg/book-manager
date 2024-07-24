const db = require("../helpers/db_helpers");
const { CartDetail, Order, PaymentTransaction, User } = require("../models");
const Book = require("../models/book_model");
const VnpayTransactionController = require("./VnpayTransactionController");

exports.createOrder = async (req, res) => {
  try {
    const user_id = req.auth.user_id;
    const shippingFee = 25000;
    const listCart = req.body.listCart;

    const carts = await CartDetail.findAll({
      where: {
        user_id,
        cart_id: listCart,
        status: 1,
      },
    });

    if (carts.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống", status: "-1" });
    }
    const user = await User.findOne({
      where: {
        user_id,
      },
    });
    let totalPrice = 0;
    let totalQuantity = 0;

    const items = [];

    for (const cart of carts) {
      const book = await Book.findByPk(cart.book_id);
      if (!book) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy sách", status: "-1" });
      }
      totalPrice += book.new_price * cart.quantity;
      totalQuantity += cart.quantity;
      items.push({
        ...book,
        totalPrice,
        totalQuantity,
        shippingFee,
      });
    }

    totalPrice += shippingFee;

    const newOrder = await Order.create({
      userId: user_id,
      quantity: totalQuantity,
      totalPrice: totalPrice,
      shippingFee: shippingFee,
      paymentType: req.body.paymentType || "online",
      paymentStatus: "pending",
      orderStatus: "pending",
      address: req.body.address || "Địa chỉ mặc định",
      items: JSON.stringify(items),
    });

    await CartDetail.destroy({
      where: {
        user_id,
        status: 1,
        cart_id: listCart,
      },
    });
    await PaymentTransaction.create({
      customerId: user_id,
      fullName: user.username,
      email: user.email,
      totalAmount: totalPrice,
      paymentMethod: "banking",
      orderId: newOrder.id,
      totalMoneyAfterDiscount: totalPrice,
    });

    const payUrl = await VnpayTransactionController.createPayUrl({
      customer: user_id,
      order: newOrder.id,
      totalAmount: totalPrice,
      ip: req.ip,
      merchantReturnUrl:
        "https://book-manager-phi.vercel.app/payment/payment-callback",
    });

    return res.json({
      status: "0",
      message: " Tạo đơn hàng thành công, tiến hành thanh toán!",
      orderId: newOrder.id,
      totalPrice: totalPrice,
      totalQuantity: totalQuantity,
      shippingFee: shippingFee,
      payUrl: payUrl,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi tạo đơn hàng", status: "-1" });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const userId = req.auth.user_id;
    const { status } = req.query;
    let searchConditions = { userId };
    if (status) {
      searchConditions.status = status;
    }

    const orders = await Order.findAll({
      where: searchConditions,
    });

    if (orders.length <= 0) {
      return res.json({
        code: 1,
        message: "Bạn chưa có đơn hàng nào!",
      });
    }

    res.json({ orders, code: 0, message: "Thành công!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: -1,
      message: "Hệ thống bận!",
    });
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
