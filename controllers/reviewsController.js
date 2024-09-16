const { Op } = require("sequelize");
const { Review, User, Book, Order } = require("../models");

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
      const order = await Order.findOne({
        where: { id: req.body.orderId },
        attributes: ["items"],
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const items = JSON.parse(order.items);
      const itemIndex = items.findIndex(
          (item) => item.book_id === req.body.bookId
      );

      if (itemIndex !== -1) {
        items[itemIndex].isReview = true;

        await Order.update(
            { items: JSON.stringify(items) },
            { where: { id: req.body.orderId } }
        );
      }

      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


  getAll: async (req, res) => {
    try {
      const { bookTitle } = req.query;

      let reviews = [];
      let booksMap = {};

      if (bookTitle) {
        const books = await Book.findAll({
          where: {
            title: {
              [Op.like]: `%${bookTitle}%`,
            },
          },
        });

        if (books.length > 0) {
          const bookIds = books.map((book) => book.book_id);

          reviews = await Review.findAll({
            where: {
              bookId: bookIds,
            },
          });

          booksMap = books.reduce((map, book) => {
            map[book.book_id] = book;
            return map;
          }, {});
        }
      } else {
        reviews = await Review.findAll({
          where: {
            hide: false,
          },
        });

        const bookIds = [...new Set(reviews.map((review) => review.bookId))];

        const books = await Book.findAll({
          where: {
            book_id: bookIds,
          },
        });

        booksMap = books.reduce((map, book) => {
          map[book.book_id] = book;
          return map;
        }, {});
      }

      res.json({ reviews, booksMap });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAllV2: async (req, res) => {
    try {
      const { bookTitle } = req.query;

      let reviews = [];
      let booksMap = {};

      if (bookTitle) {
        const books = await Book.findAll({
          where: {
            title: {
              [Op.like]: `%${bookTitle}%`,
            },
          },
        });

        if (books.length > 0) {
          const bookIds = books.map((book) => book.book_id);

          reviews = await Review.findAll({
            where: {
              bookId: bookIds,
            },
          });

          booksMap = books.reduce((map, book) => {
            map[book.book_id] = book;
            return map;
          }, {});
        }
      } else {
        reviews = await Review.findAll();

        const bookIds = [...new Set(reviews.map((review) => review.bookId))];

        const books = await Book.findAll({
          where: {
            book_id: bookIds,
          },
        });

        booksMap = books.reduce((map, book) => {
          map[book.book_id] = book;
          return map;
        }, {});
      }

      res.json({ reviews, booksMap });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { bookId } = req.params;

      if (!bookId) {
        return res.status(400).json({ error: "bookId is required" });
      }

      const reviews = await Review.findAll({
        where: { bookId: bookId },
      });

      if (reviews.length === 0) {
        return res
          .status(404)
          .json({ message: "No reviews found for this book" });
      }

      const book = await Book.findOne({
        where: { book_id: bookId },
      });

      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.json({ reviews, book });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const review = await Review.findByPk(req.params.id);
      if (review) {
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
      const { id } = req.params;

      const review = await Review.findByPk(id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      await review.destroy();

      res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deletebyadmin: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await Review.findByPk(id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      await review.destroy();

      res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  hide: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await Review.findByPk(id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      review.hide = true;
      await review.save();

      res.status(200).json({ message: "Review hidden successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = reviewController;
//
