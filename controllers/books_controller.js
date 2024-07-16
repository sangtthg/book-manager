const multer = require("multer");
const helpers = require("../helpers/helpers");
const Author = require("../models/author_model");
const Book = require("../models/book_model");
const Category = require("../models/category_model");
const { selectUser } = require("../Service/user");
const { uppercase } = require("../utilities/string/uppercase");
const { uploadFileToCloud } = require("../helpers/upload_helpers");
const msg_success = "successfully";
const msg_fail = "fail";
const upload = multer();

module.exports.controller = (app, io, socket_list) => {
  app.post(
    "/api/book/add",
    helpers.authorization,
    upload.single("book_avatar"),
    (req, res) => {
      helpers.CheckParameterValid(
        res,
        req.body,
        [
          "title",
          "author_id",
          "category_id",
          "description",
          "publication_year",
          "old_price",
          "new_price",
        ],
        async () => {
          helpers.CheckParameterNull(
            res,
            req.body,
            [
              "title",
              "author_id",
              "category_id",
              "description",
              "publication_year",
              "old_price",
              "new_price",
            ],
            async () => {
              try {
                const file = req.file;

                if (!file) {
                  return res.json({
                    status: "0",
                    message: "File not found",
                  });
                }
                if (!file.mimetype.startsWith("image/")) {
                  return res.json({
                    status: "0",
                    message: "File type not supported",
                  });
                }

                const [user, author, category] = await Promise.all([
                  selectUser(req.auth.user_id),
                  Author.findOne({ where: { author_id: req.body.author_id } }),
                  Category.findOne({
                    where: { category_id: req.body.category_id },
                  }),
                ]);

                if (!user || !author || !category) {
                  return res.json({
                    status: "0",
                    message: `${!user ? "User" : ""}${!author ? "Author" : ""}${
                      !category ? "Category" : ""
                    } not found`,
                  });
                }

                if (user.role == "user") {
                  return res.json({
                    status: "0",
                    message: "You are not authorized to perform this action",
                  });
                }

                const url = await uploadFileToCloud(file);

                const {
                  title,
                  author_id,
                  category_id,
                  description,
                  publication_year,
                  old_price,
                  new_price,
                } = req.body;

                const book = await Book.create({
                  title: uppercase(title),
                  author_id,
                  category_id,
                  description: uppercase(description),
                  publication_year,
                  book_avatar: url,
                  old_price,
                  new_price,
                });

                if (book) {
                  return res.json({
                    status: "1",
                    message: msg_success,
                    data: book,
                  });
                }
                return res.json({ status: "0", message: msg_fail });
              } catch (error) {
                console.log("/api/book/add error: ", error);
                res.json({ status: "0", message: msg_fail });
              }
            }
          );
        }
      );
    }
  );

  app.get("/api/book/get", helpers.authorization, async (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.body;
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      const books = await Book.findAll({ offset, limit });

      const bookData = await Promise.all(
        books.map(async (book) => {
          const [author, category] = await Promise.all([
            Author.findOne({ where: { author_id: book.author_id } }),
            Category.findOne({ where: { category_id: book.category_id } }),
          ]);

          return {
            book_id: book.book_id,
            title: book.title,
            author_name: author.author_name,
            category_name: category.category_name,
            description: book.description,
            publication_year: book.publication_year,
            book_avatar: book.book_avatar,
            old_price: book.old_price,
            new_price: book.new_price,
            views_count: book.views_count,
            purchase_count: book.purchase_count,
            used_books: book.used_books,
          };
        })
      );

      if (books) {
        return res.json({
          status: "1",
          message: msg_success,
          data: {
            total: bookData.length,
            data: bookData,
          },
        });
      }

      return res.json({ status: "0", message: msg_fail });
    } catch (error) {
      console.log("/api/book/get error: ", error);
      res.json({ status: "0", message: msg_fail });
    }
  });

  //Update book
  app.post(
    "/api/book/update",
    helpers.authorization,
    upload.single("book_avatar"),
    async (req, res) => {
      helpers.CheckParameterValid(res, req.body, ["book_id"], async () => {
        helpers.CheckParameterNull(res, req.body, ["book_id"], async () => {
          try {
            const file = req.file;
            const book = await Book.findOne({
              where: { book_id: req.body.book_id },
            });

            if (!book) {
              return res.json({
                status: "0",
                message: "Book not found",
              });
            }

            const url = file ? await uploadFileToCloud(file) : book.book_avatar;

            const {
              title,
              author_id,
              category_id,
              description,
              publication_year,
              old_price,
              new_price,
            } = req.body;

            if (author_id !== null) {
              const author = await Author.findOne({ where: { author_id } });
              if (!author) {
                return res.json({
                  status: "0",
                  message: "Author not found",
                });
              }
            }

            if (category_id !== null) {
              const category = await Category.findOne({
                where: { category_id },
              });
              if (!category) {
                return res.json({
                  status: "0",
                  message: "Category not found",
                });
              }
            }

            const updateData = {
              title: title !== null ? uppercase(title) : book.title,
              author_id: author_id !== null ? author_id : book.author_id,
              category_id:
                category_id !== null ? category_id : book.category_id,
              description:
                description !== null
                  ? uppercase(description)
                  : book.description,
              publication_year:
                publication_year !== null
                  ? publication_year
                  : book.publication_year,
              book_avatar: url,
              old_price: old_price !== null ? old_price : book.old_price,
              new_price: new_price !== null ? new_price : book.new_price,
            };

            const updatedBook = await Book.update(updateData, {
              where: { book_id: req.body.book_id },
            });

            if (updatedBook) {
              return res.json({
                status: "1",
                message: msg_success,
              });
            }

            return res.json({ status: "0", message: msg_fail });
          } catch (error) {
            console.log("/api/book/update error: ", error);
            res.json({ status: "0", message: msg_fail });
          }
        });
      });
    }
  );

  // viết 1 api cho màn home trả về 2 danh sách:
  // 1. sách mới xuất bản
  // 2. sách bán chạy
  app.get("/api/home/get-list-book", async (req, res) => {
    try {
      // where 12 tháng gần nhất

      const newBooks = await Book.findAll({
        where: { publication_year: new Date().getFullYear() },
        order: [["created_at", "DESC"]],
        limit: 10,
      });

      const bestSellerBooks = await Book.findAll({
        order: [["purchase_count", "DESC"]],
        limit: 10,
      });

      const newBooksData = await Promise.all(
        newBooks.map(async (book) => {
          const author = await Author.findOne({
            where: { author_id: book.author_id },
          });

          return {
            book_id: book.book_id,
            title: book.title,
            author_name: author.author_name,
            description: book.description,
            publication_year: book.publication_year,
            book_avatar: book.book_avatar,
            old_price: book.old_price,
            new_price: book.new_price,
            views_count: book.views_count,
            purchase_count: book.purchase_count,
            used_books: book.used_books,
          };
        })
      );

      const bestSellerBooksData = await Promise.all(
        bestSellerBooks.map(async (book) => {
          const author = await Author.findOne({
            where: { author_id: book.author_id },
          });

          return {
            book_id: book.book_id,
            title: book.title,
            author_name: author.author_name,
            description: book.description,
            publication_year: book.publication_year,
            book_avatar: book.book_avatar,
            old_price: book.old_price,
            new_price: book.new_price,
            views_count: book.views_count,
            purchase_count: book.purchase_count,
            used_books: book.used_books,
          };
        })
      );

      if (newBooks && bestSellerBooks) {
        return res.json({
          status: "1",
          message: msg_success,
          data: {
            new_books: newBooksData,
            best_seller_books: bestSellerBooksData,
          },
        });
      }

      return res.json({ status: "0", message: msg_fail });
    } catch (error) {
      console.log("/api/home error: ", error);
      res.json({ status: "0", message: msg_fail });
    }
  });
};
