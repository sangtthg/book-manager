const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const helpers = require("../helpers/helpers");

router.get("/orders", helpers.authorization, orderController.listOrders);
router.post("/create-order", helpers.authorization, orderController.createOrder);

module.exports = router;
