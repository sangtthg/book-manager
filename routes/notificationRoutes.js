const express = require("express");
const router = express.Router();
const {
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  createNotificationByadmin,
  getSystemNotifications,
  deleteNotification,
} = require("../controllers/notificationController");
const helpers = require("../helpers/helpers");
const upload = require("../config/upload");

router.get("/notifications", helpers.authorization, getNotificationsByUser);

router.patch(
  "/notifications/:notificationId/read",
  helpers.authorization,
  markAsRead
);

router.patch("/notifications/read-all", helpers.authorization, markAllAsRead);
router.post("/system",upload.single("image"),  createNotificationByadmin);
router.get("/create", (req, res) => {
  res.render("Notification");
});
router.get("/system", getSystemNotifications);
router.delete("/:id", deleteNotification);

module.exports = router;