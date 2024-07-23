const express = require("express");
const router = express.Router();
const helpers = require("../helpers/helpers");
const { paymentCallback } = require("../controllers/PaymentController");

router.get("/payment-callback", paymentCallback);


module.exports = router;
