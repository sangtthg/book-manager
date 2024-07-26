const express = require('express');
const router = express.Router();
const { getNotificationsByUser, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/notifications', getNotificationsByUser);

router.patch('/notifications/:notificationId/read', markAsRead);

router.patch('/notifications/read-all', markAllAsRead);

module.exports = router;
