const express = require("express");
const router = express.Router();
const VnpayTransactionController = require("../controllers/VnpayTransactionController");
const helpers = require("../helpers/helpers");

router.post("/transaction/afterUpdate", VnpayTransactionController.afterUpdate);
router.post("/transaction/createUrl", VnpayTransactionController.createUrl);
router.post(
  "/transaction/verifyInputData",
  VnpayTransactionController.verifyInputData
);
router.post("/transaction/refundVnp", VnpayTransactionController.refundVnp);
router.post(
  "/transaction/collectedTransCalculateExp",
  VnpayTransactionController.collectedTransCalculateExp
);

module.exports = router;