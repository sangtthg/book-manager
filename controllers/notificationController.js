const { Notification, User, Order } = require("../models");

const createNotification = async (userId, type, orderId) => {
  // const { type, orderId } = req.body;
  // const userId = req.auth.user_id;

  try {
    const user = await User.findByPk(userId);
    const order = await Order.findByPk(orderId);
    let title = "";
    let message = "";

    if (!user || !order) {
      return res.status(404).json({ error: "User or Order not found" });
    }

    switch (type) {
      case "createOrder":
        title = "Hoàn tất thanh toán";
        const paymentDeadline = new Date(
            Date.now() + 15 * 60000
        ).toLocaleString();
        message = `Xin chào ${user.username}, đơn hàng giá trị ${order.totalPrice} vui lòng thanh toán trước ${paymentDeadline}. Vui lòng bỏ qua tin nhắn này nếu bạn đã thanh toán.`;
        break;
      case "cancelled":
        title = "Huỷ đơn hàng";
        message = `Huỷ đơn hàng ${order.id} thành công.`;
        break;
      case "wait_for_delivery":
        title = "Bạn có đơn hàng đang trên đường giao";
        message = `Shipper bảo rằng: Đơn hàng ${order.id} đang trên đường giao đến bạn.`;
        break;
      case "delivered":
        title = "Giao kiện hàng thành công";
        message = `Kiện hàng ${order.id} đã giao thành công đến bạn.`;
        break;
      default:
        return res.status(400).json({ error: "Invalid notification type" });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      isRead: false,
    });

    return { code: 0, message: "Tạo thông báo thành công", notification };
  } catch (error) {
    console.log(error);
    return { code: -1, message: "Lỗi khi tạo thông báo" };
  }
};
const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.auth.user_id;

  try {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  const userId = req.auth.user_id;

  try {
    await Notification.update(
        { isRead: true },
        { where: { userId: userId, isRead: false } }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getNotificationsByUser = async (req, res) => {
  const userId = req.auth.user_id;

  try {
    const notifications = await Notification.findAll({
      where: {
        userId: userId,
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  markAsRead,
  markAllAsRead,
  createNotification,
  getNotificationsByUser,
};