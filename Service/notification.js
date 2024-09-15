const admin = require("firebase-admin");
const DevicesModel = require("../models/devices_model");
class NotificationService {
  static pushNotification = async (title, body, userId, data) => {
    // userId nếu truyền vào là null thì sẽ là push notification của system đến tất cả người dùng
    const isNotificationOfSystem = userId == null;
    const tokens = [];
    const devices = isNotificationOfSystem
      ? await DevicesModel.findAll()
      : await DevicesModel.findAll({ where: { user_id: userId } });
    devices.forEach((element) => {
      tokens.push(element.device_token);
    });
    if (tokens.length === 0) return;
    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens,
    };

    if (data) {
      message.data = data;
    }

    const messaging = admin.messaging();

    messaging
      .sendEachForMulticast(message)
      .then((response) => {
        console.log(response.responses[0].error);
        console.log(response.successCount + " messages were sent successfully");
      })
      .catch((error) => {
        console.log("Lỗi khi gửi thông báo:", error);
      });
  };
}

module.exports = NotificationService;
