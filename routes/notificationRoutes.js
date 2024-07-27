const express = require("express");
const router = express.Router();
const {
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const helpers = require("../helpers/helpers");

router.get("/notifications", helpers.authorization, getNotificationsByUser);

router.patch("/notifications/:notificationId/read", helpers.authorization, markAsRead);

router.patch("/notifications/read-all", helpers.authorization, markAllAsRead);

module.exports = router;