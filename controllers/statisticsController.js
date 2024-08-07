const { Op } = require("sequelize");
const { Order, User, sequelize } = require("../models");

exports.getRevenueStatisticsPage = (req, res) => {
  res.render("revenueStatistics", { title: "Thống kê doanh thu" });
};

exports.getCustomerStatisticsPage = (req, res) => {
  res.render("customerStatistics", { title: "Thống kê khách hàng" });
};

exports.getRevenueStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Cần có ngày bắt đầu và ngày kết thúc" });
    }

    const revenue = await Order.sum("totalPrice", {
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        statusShip: "delivered",
        orderStatus: "success",
      },
    });

    const orderCount = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
    });

    const pendingOrders = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        statusShip: "pending",
      },
    });

    const cancelledOrders = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        statusShip: "cancelled",
      },
    });

    const paymentFailedOrders = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        paymentStatus: "fail",
      },
    });

    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        // statusShip: "delivered",
        // paymentStatus: "success",
      },
      attributes: [
        "quantity",
        "id",
        "statusShip",
        "totalPrice",
        "items",
        [sequelize.fn("COUNT", sequelize.col("statusShip")), "count"],
      ],
      group: ["quantity", "id", "statusShip", "totalPrice", "items"],
    });
    console.log(orders, "orrrr");

    res.json({
      revenue,
      orderCount,
      pendingOrders,
      cancelledOrders,
      paymentFailedOrders,
      startDate,
      endDate,
      orders,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};

exports.getCustomerStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Cần có ngày bắt đầu và ngày kết thúc" });
    }

    const customers = await User.findAll({
      attributes: ["username", "email", "created_at"],
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        role: "user",
      },
    });

    const totalCount = await User.count({
      where: {
        role: "user",
      },
    });

    res.json({
      customerCount: customers.length,
      totalCount,
      customers,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê khách hàng:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};
const formatNumber = (number) => {
  return number.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};


exports.getItemDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Cần có ID mặt hàng" });
    }

    const item = await Order.findOne({
      where: { id },
      attributes: ["items"],
    });

    if (!item) {
      return res.status(404).json({ error: "Mặt hàng không tìm thấy" });
    }

    const items = JSON.parse(item.items);
    items.forEach(i => {
      i.totalPrice = formatNumber(i.totalPrice);
      i.old_price = formatNumber(parseFloat(i.old_price));
      i.new_price = formatNumber(parseFloat(i.new_price));
      i.shippingFee = formatNumber(i.shippingFee);
    });

    res.render("itemDetails", {
      title: "Chi tiết mặt hàng",
      items,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết mặt hàng:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};