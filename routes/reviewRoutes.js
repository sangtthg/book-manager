const express = require("express");
const reviewController = require("../controllers/reviewsController");
const helpers = require("../helpers/helpers");
const router = express.Router();

router.post("/", helpers.authorization, reviewController.create);

router.get("/", helpers.authorization, reviewController.getAll);

router.get("/:id", helpers.authorization, reviewController.getById);

router.put("/:id", helpers.authorization, reviewController.update);

router.delete("/:id", helpers.authorization, reviewController.delete);

module.exports = router;
