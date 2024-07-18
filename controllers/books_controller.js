const multer = require("multer");
const helpers = require("../helpers/helpers");
const Author = require("../models/author_model");
const Book = require("../models/book_model");
const Category = require("../models/category_model");
const { selectUser } = require("../Service/user");
const { uppercase } = require("../utilities/string/uppercase");
const { uploadFileToCloud } = require("../helpers/upload_helpers");
const { Sequelize } = require("sequelize");
const sequelizeHelpers = require("../helpers/sequelize_helpers");
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
      const page = req.body.page || 1;
      const limit = req.body.limit || 10;
      const { search = "", category_id } = req.body.query || {
        search: "",
        category_id: undefined,
      };
      const offset = (page - 1) * limit;

      const [results, metadata] = await sequelizeHelpers.query(
        `
        SELECT 
    books.book_id,
    books.title,
    authors.author_name,
    categories.category_name,
    books.description,
    books.publication_year,
    books.book_avatar,
    books.old_price,
    books.new_price,
    books.views_count,
    books.purchase_count,
    books.used_books
  FROM 
    books
  INNER JOIN 
    authors ON books.author_id = authors.author_id
  INNER JOIN 
    categories ON books.category_id = categories.category_id
    WHERE books.title LIKE '%${search}%' ${
          category_id ? `AND books.category_id = ${category_id}` : ""
        }
  LIMIT ${limit} OFFSET ${offset}
        `
      );

      const [totalAll] = await sequelizeHelpers.query(
        `SELECT COUNT(*) as totalAll FROM books`
      );

      if (results) {
        return res.json({
          status: "1",
          message: msg_success,
          data: {
            total: results.length,
            totalAll: totalAll[0].totalAll,
            data: results,
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
      const [newBooks, bestSellerBooks, mostViewBooks, randomBooks] =
        await Promise.all([
          Book.findAll({
            where: { publication_year: new Date().getFullYear() },
            order: [["created_at", "DESC"]],
            limit: 7,
          }),
          Book.findAll({
            order: [["purchase_count", "DESC"]],
            limit: 7,
          }),
          Book.findAll({
            order: [["views_count", "DESC"]],
            limit: 7,
          }),
          Book.findAll({
            order: Sequelize.literal("rand()"),
            limit: 7,
          }),
        ]);

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

      mostViewBooksData = await Promise.all(
        mostViewBooks.map(async (book) => {
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

      randomBooksData = await Promise.all(
        randomBooks.map(async (book) => {
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
            most_view_books: mostViewBooksData,
            random_books: randomBooksData,
          },
        });
      }

      return res.json({ status: "0", message: msg_fail });
    } catch (error) {
      console.log("/api/home error: ", error);
      res.json({ status: "0", message: msg_fail });
    }
  });

  app.get("/api/book/get-detail", helpers.authorization, async (req, res) => {
    helpers.CheckParameterValid(res, req.body, ["book_id"], async () => {
      helpers.CheckParameterNull(res, req.body, ["book_id"], async () => {
        try {
          const book = await Book.findOne({
            where: { book_id: req.body.book_id },
          });

          if (!book) {
            return res.json({
              status: "0",
              message: "Book not found",
            });
          }

          const author = await Author.findOne({
            where: { author_id: book.author_id },
          });

          const category = await Category.findOne({
            where: { category_id: book.category_id },
          });

          const data = {
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

          return res.json({
            status: "1",
            message: msg_success,
            data,
          });
        } catch (error) {
          console.log("/api/book/get-detail error: ", error);
          res.json({ status: "0", message: msg_fail });
        }
      });
    });
  });
};
