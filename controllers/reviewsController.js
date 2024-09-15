const { Op } = require("sequelize");
const { Review, User, Book, Order } = require("../models");
const db = require("../models");
const db_helpers = require("../helpers/db_helpers");

const reviewController = {
  create: async (req, res) => {
    try {
      const user = await User.findByPk(req.body.userId); // Lấy userId từ body nếu cần
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const review = await Review.create({
        ...req.body,
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

  // getAllV2: async (req, res) => {
  //   try {
  //     const { bookTitle } = req.query;

  //     let reviews = [];
  //     let booksMap = {};

  //     if (bookTitle) {
  //       const books = await Book.findAll({
  //         where: {
  //           title: {
  //             [Op.like]: `%${bookTitle}%`,
  //           },
  //         },
  //       });

  //       if (books.length > 0) {
  //         const bookIds = books.map((book) => book.book_id);

  //         reviews = await Review.findAll({
  //           where: {
  //             bookId: bookIds,
  //           },
  //         });

  //         booksMap = books.reduce((map, book) => {
  //           map[book.book_id] = book;
  //           return map;
  //         }, {});
  //       }
  //     } else {
  //       reviews = await Review.findAll();

  //       const bookIds = [...new Set(reviews.map((review) => review.bookId))];

  //       const books = await Book.findAll({
  //         where: {
  //           book_id: bookIds,
  //         },
  //       });

  //       booksMap = books.reduce((map, book) => {
  //         map[book.book_id] = book;
  //         return map;
  //       }, {});
  //     }

  //     res.json({ reviews, booksMap });
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // },

  getAllV2: async (req, res) => {
    try {
      const { bookTitle = "" } = req.query;

      const query = `
        SELECT 
        b.book_id, b.title, b.author_id, b.description, b.category_id, b.publication_year, 
        b.book_avatar, b.created_at, b.views_count, b.purchase_count, b.old_price, 
        b.new_price, b.used_books, b.quantity, b.avatar_reviews, b.rate_book,
        r.review_id, r.user_id, r.rating, r.comment, r.review_images, r.created_at as review_created_at,
        u.username as review_user_name, u.avatar as review_user_avatar,
        u.user_id as review_user_id
        FROM 
          books b
        Inner JOIN 
          reviews r ON b.book_id = r.book_id
        Inner JOIN 
          users u ON r.user_id = u.user_id
        WHERE 
          b.title LIKE CONCAT('%', ?, '%');
      `;

      db_helpers.query(query, [bookTitle], (err, results) => {
        if (err) throw err;

        // Nhóm các đánh giá theo sách
        const booksMap = results.reduce((acc, row) => {
          const {
            book_id,
            title,
            author_id,
            description,
            category_id,
            publication_year,
            book_avatar,
            created_at,
            views_count,
            purchase_count,
            old_price,
            new_price,
            used_books,
            quantity,
            avatar_reviews,
            rate_book,
            review_id,
            user_id,
            rating,
            comment,
            review_images,
            review_created_at,
            review_user_avatar,
            review_user_name,
          } = row;

          if (!acc[book_id]) {
            acc[book_id] = {
              book_id,
              title,
              author_id,
              description,
              category_id,
              publication_year,
              book_avatar,
              created_at,
              views_count,
              purchase_count,
              old_price,
              new_price,
              used_books,
              quantity,
              avatar_reviews,
              rate_book,
              reviews: [],
            };
          }

          if (review_id) {
            acc[book_id].reviews.push({
              review_id,
              user: {
                user_id,
                name: review_user_name,
                avatar: review_user_avatar,
              },
              rating,
              comment,
              review_images,
              created_at: review_created_at,
            });
          }

          return acc;
        }, {});

        // Chuyển đổi sách thành mảng
        const books = Object.values(booksMap);

        console.log("datta", books);
        res.json({ books });
      });
    } catch (error) {
      console.log(error);
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
