const db = require("../helpers/db_helpers");
const {
  CartDetail,
  Order,
  PaymentTransaction,
  User,
  Author,
  Voucher,
  UserVoucher,
} = require("../models");
const Book = require("../models/book_model");
const { createNotification } = require("./notificationController");
const moment = require("moment");
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

    let totalPrice = 0;
    let totalQuantity = 0;
    const items = [];

    for (const cart of carts) {
      const book = await Book.findByPk(cart.book_id);
      if (!book) {
        return res.status(404).json({ message: "Không tìm thấy sách", status: "-1" });
      }
      totalPrice += book.new_price * cart.quantity;
      totalQuantity += cart.quantity;
      items.push({
        ...book.dataValues,
        totalPrice,
        quantity: cart.quantity,
        shippingFee,
        isReview: false,
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
      listCartId: listCart,
      phone: req.body.phone || "0123456789",
    });

    const notificationResult = await createNotification(user_id, "createOrder", newOrder.id);

    if (notificationResult.code === -1) {
      return res.status(500).json(notificationResult);
    }

    const currentDate = moment();
    const deliveryStartDate = currentDate.add(4, "days").format("DD [tháng] MM");
    const deliveryEndDate = currentDate.add(2, "days").format("DD [tháng] MM");
    const deliveryDateText = `Nhận hàng vào ${deliveryStartDate} - ${deliveryEndDate}`;

    return res.json({
      status: "0",
      message: "Tạo đơn hàng thành công, tiến hành thanh toán!",
      orderId: newOrder.id,
      totalPrice: totalPrice,
      totalQuantity: totalQuantity,
      shippingFee: shippingFee,
      items,
      deliveryDateText,
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
      searchConditions.statusShip = status;
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

    const parsedOrders = await Promise.all(
      orders.map(async (order) => {
        const items = JSON.parse(order.dataValues.items);
        const itemsWithAuthorName = await Promise.all(
          items.map(async (item) => {
            const author = await Author.findByPk(item.author_id);
            return {
              ...item,
              author_name: author ? author.author_name : "Unknown",
            };
          })
        );
        return {
          ...order.dataValues,
          items: itemsWithAuthorName,
        };
      })
    );

    res.json({ orders: parsedOrders, code: 0, message: "Thành công!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: -1,
      message: "Hệ thống bận!",
    });
  }
};
function formatNumber(number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(number);
}

exports.listAllOrders = async (req, res) => {
  try {
    const { status, orderId, username } = req.query;
    let searchConditions = {};

    if (status) {
      searchConditions.statusShip = status;
    }

    if (orderId) {
      searchConditions.id = orderId;
    }

    const orders = await Order.findAll({
      where: searchConditions,
    });

    const userIds = orders.map((order) => order.userId);

    const users = await User.findAll({
      where: {
        user_id: userIds,
      },
    });

    const userMap = users.reduce((map, user) => {
      map[user.user_id] = user.username;
      return map;
    }, {});

    const statusMap = {
      wait_for_delivery: "Chờ giao hàng",
      pending: "Đang xử lý",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
      fail: "Lỗi",
    };

    let ordersWithUsernames = orders.map((order) => ({
      ...order.toJSON(),
      username: userMap[order.userId] || "Không xác định",
      totalPrice: formatNumber(order.totalPrice),
      statusShip: statusMap[order.statusShip] || "Không xác định",
    }));

    // Lọc theo tên người dùng nếu có
    if (username) {
      ordersWithUsernames = ordersWithUsernames.filter((order) =>
        order.username.toLowerCase().includes(username.toLowerCase())
      );
    }

    res.render("orders", {
      orders: ordersWithUsernames,
      currentStatus: status || "",
      currentOrderId: orderId || "",
      currentUsername: username || "",
    });
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
    const { orderId, status } = req.body;

    const order = await Order.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng",
        code: -1,
      });
    }
    if (status === "cancelled" && order.paymentStatus !== "pending") {
      return res.status(400).json({
        message: "Không thể hủy đơn hàng!",
        code: -1,
      });
    }
    order.statusShip = status;
    await order.save();
    await createNotification(order.userId, status, order.id);

    return res.json({
      message: "Cập nhật trạng thái thành công",
      code: 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Hệ thống bận!",
      code: -1,
    });
  }
};


exports.payOrder = async (req, res) => {
  try {
    const user_id = req.auth.user_id;
    const { orderId, code } = req.body;
    const user = await User.findOne({
      where: {
        user_id,
      },
    });
    const orderItem = await Order.findOne({
      where: {
        id: orderId,
        paymentStatus: "pending",
      },
    });
    if (!orderItem) {
      return res.status(400).json({
        message: "Không tìm thấy đơn hàng nào cần thanh toán!",
        status: -1,
      });
    }

    let totalPrice = orderItem.totalPrice;
    let discount = 0;

    if (code) {
      const voucher = await Voucher.findOne({
        where: {
          code: code,
        },
      });

      if (!voucher) {
        return res.json({ code: 5, message: "Không tìm thấy mã voucher" });
      }

      const userVoucher = await UserVoucher.findOne({
        where: {
          userId: user_id,
          voucherId: voucher.id,
        },
      });

      if (userVoucher) {
        return res.json({ code: 6, message: "Bạn đã sử dụng voucher này rồi" });
      }

      const now = moment();
      const validFrom = moment(voucher.validFrom);
      const validTo = moment(voucher.validTo);

      if (now.isBefore(validFrom) || now.isAfter(validTo)) {
        return res.json({ code: 7, message: "Voucher đã hết hạn hoặc chưa bắt đầu" });
      }

      if (voucher.quantity <= 0) {
        return res.json({ code: 8, message: "Voucher đã hết số lượng sử dụng" });
      }

      discount = voucher.discountAmount || 0;
      totalPrice -= discount;

      await voucher.update({ quantity: voucher.quantity - 1 });

      await UserVoucher.create({
        userId: user_id,
        voucherId: voucher.id,
      });

      await orderItem.update({
        totalPrice: totalPrice,
        voucherId: voucher.id,
      });
    }

    const items = JSON.parse(orderItem.items);
    for (const item of items) {
      const book = await Book.findOne({
        where: { book_id: item.book_id },
      });

      if (book) {
        await book.update({
          purchase_count: book.purchase_count - item.quantity,
        });
      }
    }

    await PaymentTransaction.create({
      customerId: user_id,
      fullName: user.username,
      email: user.email,
      totalAmount: orderItem.totalPrice,
      paymentMethod: "banking",
      orderId,
      totalMoneyAfterDiscount: totalPrice,
    });

    const payUrl = await VnpayTransactionController.createPayUrl({
      customer: user_id,
      order: orderId,
      totalAmount: totalPrice,
      ip: req.ip,
      merchantReturnUrl:
        "https://book-manager-phi.vercel.app/payment/payment-callback",
    });

    return res.json({
      status: "0",
      message: "Thành công!",
      payUrl: payUrl,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Hệ thống bận!",
      code: -1,
    });
  }
};

exports.cancelled = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.auth.user_id,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng",
        code: -1,
      });
    }

    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        message: "Không thể hủy đơn hàng!",
        code: -1,
      });
    }

    order.statusShip = "cancelled";
    await order.save();
    await createNotification(order.userId, "cancelled", order.id);

    return res.json({
      message: "Hủy đơn hàng thành công",
      code: 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Hệ thống bận!",
      code: -1,
    });
  }
};