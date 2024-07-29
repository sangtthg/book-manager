const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

router.get('/revenue', statisticsController.getRevenueStatisticsPage);
router.get('/customers', statisticsController.getCustomerStatisticsPage);

router.get('/revenue/data', statisticsController.getRevenueStatistics);
router.get('/customers/data', statisticsController.getCustomerStatistics);
router.get('/items/:id', statisticsController.getItemDetails);

module.exports = router;