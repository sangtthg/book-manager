const { Review, User } = require("../models");

const reviewController = {
  create: async (req, res) => {
    try {
      const user = await User.findByPk(req.auth.user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const review = await Review.create({
        ...req.body,
        userId: req.auth.user_id,
        reviewerName: user.username,
        reviewerAvatar: user.avatar,
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const reviews = await Review.findAll();
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const review = await Review.findByPk(req.params.id);
      if (review) {
        res.status(200).json(review);
      } else {
        res.status(404).json({ message: "Review not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const review = await Review.findByPk(req.params.id);
      if (review) {
        if (review.userId !== req.auth.user_id) {
          return res.status(403).json({ message: "Unauthorized" });
        }
        await review.update(req.body);
        res.status(200).json(review);
      } else {
        res.status(404).json({ message: "Review not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const review = await Review.findByPk(req.params.id);
      if (review) {
        if (review.userId !== req.auth.user_id) {
          return res.status(403).json({ message: "Unauthorized" });
        }
        await review.destroy();
        res.status(200).json({ message: "Review deleted" });
      } else {
        res.status(404).json({ message: "Review not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = reviewController;
