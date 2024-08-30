const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");

router.post("/create", voucherController.createVoucher);
router.get("/", voucherController.getAllVouchers);
router.post("/update/:id", voucherController.updateVoucher);
router.get("/edit/:id", voucherController.editVoucher);
router.post("/delete/:id", voucherController.deleteVoucher);
router.get("/search", voucherController.searchVouchers);
router.get("/json", voucherController.getAllVouchersJson);
module.exports = router;
