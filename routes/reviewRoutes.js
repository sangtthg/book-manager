const express = require("express");
const reviewController = require("../controllers/reviewsController");
const helpers = require("../helpers/helpers");
const router = express.Router();

router.post("/", helpers.authorization, reviewController.create);

router.get("/",  reviewController.getAll);
router.get("/all",  reviewController.getAllV2);

router.get("/:bookId", helpers.authorization, reviewController.getById);

router.put("/:id", helpers.authorization, reviewController.update);

router.delete("/:id", reviewController.delete);
router.delete("/byadmin/:id", reviewController.deletebyadmin);

router.patch("/:id/hide", reviewController.hide);

module.exports = router;
