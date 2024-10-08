const multer = require("multer");
const helpers = require("../helpers/helpers");
const Author = require("../models/author_model");
const Book = require("../models/book_model");
const AvatarReview = require("../models/avatarReview");
const Category = require("../models/category_model");
const Order = require("../models/order_model");
const { selectUser } = require("../Service/user");
const { uppercase } = require("../utilities/string/uppercase");
const {
  uploadFileToCloud,
  uploadMultipleFilesToCloud,
} = require("../helpers/upload_helpers");
const { Sequelize } = require("sequelize");
const sequelizeHelpers = require("../helpers/sequelize_helpers");
const { arrayToString, stringToArray } = require("../utilities/string/string");
const { Op } = require("sequelize/lib/sequelize");
const { CartDetail } = require("../models");

const msg_success = "successfully";
const msg_fail = "fail";
const upload = multer();

module.exports.controller = (app, io, socket_list) => {
  app.post(
    "/api/book/add",
    helpers.authorization,
    upload.fields([
      { name: "book_avatar", maxCount: 1 },
      { name: "avatar_reviews", maxCount: 5 },
    ]),
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
          "quantity",
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
              "quantity",
            ],
            async () => {
              try {
                const title = req.body.title; // Khai báo biến title từ req.body
                const fileBookAvatar = req.files["book_avatar"]
                  ? req.files["book_avatar"][0]
                  : null;
                const fileAvatarReviews = req.files["avatar_reviews"];

                if (!fileBookAvatar) {
                  return res.json({
                    status: "0",
                    message: "Book avatar file not found",
                  });
                }
                if (!fileBookAvatar.mimetype.startsWith("image/")) {
                  return res.json({
                    status: "0",
                    message: "Book avatar file type not supported",
                  });
                }

                if (fileAvatarReviews) {
                  if (
                    fileAvatarReviews.length > 5 || // Số lượng ảnh tối đa là 5
                    fileAvatarReviews.length < 1
                  ) {
                    return res.json({
                      status: "0",
                      message: "Only 1 to 5 avatar review images are allowed",
                    });
                  }
                  for (let file of fileAvatarReviews) {
                    if (!file.mimetype.startsWith("image/")) {
                      return res.json({
                        status: "0",
                        message:
                          "One or more avatar review file types not supported",
                      });
                    }
                  }
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

                const publicationYear = parseInt(req.body.publication_year, 10);
                if (
                  isNaN(publicationYear) ||
                  publicationYear < 1000 ||
                  publicationYear > 2024
                ) {
                  return res.json({
                    status: "0",
                    message:
                      "Năm xuất bản không hợp lệ. Năm phải nằm trong khoảng từ 1000 đến 2024.",
                  });
                }
                const existingBook = await Book.findOne({ where: { title } }); // Sử dụng biến title đã khai báo

                if (existingBook) {
                  return res.json({
                    status: "0",
                    message: "Sách này đã có trước đó",
                  });
                }
                const urlBookAvatar = await uploadFileToCloud(fileBookAvatar);
                const urlAvatarReviews = fileAvatarReviews
                  ? await uploadMultipleFilesToCloud(fileAvatarReviews)
                  : [];

                const {
                  author_id,
                  category_id,
                  description,
                  publication_year,
                  old_price,
                  new_price,
                  quantity,
                } = req.body;

                const book = await Book.create({
                  title: uppercase(title),
                  author_id,
                  category_id,
                  description: uppercase(description),
                  publication_year,
                  book_avatar: urlBookAvatar,
                  old_price,
                  new_price,
                  quantity,
                  avatar_reviews: arrayToString(urlAvatarReviews),
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
  app.post(
    "/api/book/get",
    //  helpers.authorization,
    async (req, res) => {
      try {
        const page = req.body.page || 1;
        const limit = req.body.limit || 10;
        const { search = "", category_id } = req.body.query || {
          search: "",
          category_id: undefined,
        };
        const offset = (page - 1) * limit;

        const query = `
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
          books.quantity,
          books.used_books,
          books.avatar_reviews,
          books.rate_book
        FROM 
          books
        INNER JOIN 
          authors ON books.author_id = authors.author_id
        INNER JOIN 
          categories ON books.category_id = categories.category_id
        WHERE books.title LIKE '%${search}%' ${
          category_id ? `AND books.category_id = ${category_id}` : ""
        }
        GROUP BY books.book_id
        ORDER BY books.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

        const [results, metadata] = await sequelizeHelpers.query(query);

        const [totalAll] = await sequelizeHelpers.query(
          `SELECT COUNT(*) as totalAll FROM books`
        );

        for (let index = 0; index < results.length; index++) {
          const element = results[index];
          if (!element.avatar_reviews) continue;
          element.avatar_reviews = stringToArray(element.avatar_reviews);
          element.purchase_count = Math.abs(element.purchase_count);
        }

        if (results) {
          return res.json({
            status: "1",
            message: msg_success,
            data: {
              page: page,
              limit: limit,
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
    }
  );

  async function handleAvatarReview(res, files, existingUrls) {
    var resultAvatarReview = [];

    if (files && files.length !== 0) {
      var countFiles = files.length;

      if (countFiles > 5) {
        return res.json({
          status: "0",
          message: "Số lượng ảnh không hợp lệ",
        });
      }
      const uploadFilesReviewAvatar = await Promise.all(
        files.map(async (file) => {
          return await uploadFileToCloud(file);
        })
      );

      return uploadFilesReviewAvatar;
    }

    //
    const reqExistingAvatarReview = existingUrls.split(",");

    if (reqExistingAvatarReview.length === 0 && !files) {
      return res.json({
        status: "0",
        message: "Ảnh review không hợp lệ",
      });
    }

    if (reqExistingAvatarReview.length !== 0) {
      var countExistingUrls = existingUrls.length;

      if (countExistingUrls.length > 3) {
        return res.json({
          status: "0",
          message: "Số lượng ảnh không hợp lệ",
        });
      }

      return reqExistingAvatarReview;
    }

    return resultAvatarReview;
  }

  async function handleBookAvatar(res, files, existingUrl) {
    var resultBookAvatar = "";

    if (!files && !existingUrl) {
      return res.json({
        status: "0",
        message: "Book avatar không hợp lệ",
      });
    }

    if (!files && existingUrl) {
      return existingUrl;
    }

    if (files && files.length !== 0) {
      const uploadFileBookAvatar = await uploadFileToCloud(files[0]);

      resultBookAvatar = uploadFileBookAvatar;
    }

    return resultBookAvatar;
  }

  //Update book
  app.post(
    "/api/book/update",
    helpers.authorization,
    upload.fields([
      { name: "book_avatar", maxCount: 1 },
      { name: "avatar_reviews", maxCount: 5 },
    ]),
    async (req, res) => {
      helpers.CheckParameterValid(res, req.body, ["book_id"], async () => {
        helpers.CheckParameterNull(res, req.body, ["book_id"], async () => {
          try {
            const fileAvatarReviews = req.files["avatar_reviews"];

            var resultAvatarReview = await handleAvatarReview(
              res,
              fileAvatarReviews,
              req.body.existing_avatar_review
            );

            const filesBookAvatar = req.files["book_avatar"];

            const reqExistingBookAvatar = req.body.existing_book_avatar;

            var resultBookAvatar = await handleBookAvatar(
              res,
              filesBookAvatar,
              reqExistingBookAvatar
            );

            const book = await Book.findOne({
              where: { book_id: req.body.book_id },
            });

            if (!book) {
              return res.json({
                status: "0",
                message: "Book not found",
              });
            }
            const {
              title,
              author_id,
              category_id,
              description,
              publication_year,
              old_price,
              new_price,
              quantity,
            } = req.body;

            if (author_id) {
              const author = await Author.findOne({ where: { author_id } });
              if (!author) {
                return res.json({
                  status: "0",
                  message: "Author not found",
                });
              }
            }

            if (category_id) {
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
              title: title ? uppercase(title) : book.title,
              author_id: author_id || book.author_id,
              category_id: category_id || book.category_id,
              description: description
                ? uppercase(description)
                : book.description,
              publication_year: publication_year || book.publication_year,
              book_avatar: resultBookAvatar,
              quantity: quantity !== null ? quantity : book.quantity,
              old_price: old_price || book.old_price,
              new_price: new_price || book.new_price,
              avatar_reviews: arrayToString(resultAvatarReview),
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

  app.post("/api/book/delete", helpers.authorization, async (req, res) => {
    helpers.CheckParameterValid(res, req.body, ["book_id"], async () => {
      helpers.CheckParameterNull(res, req.body, ["book_id"], async () => {
        try {
          const { book_id } = req.body;

          const book = await Book.findOne({ where: { book_id } });

          if (!book) {
            return res.json({
              status: "0",
              message: "Book not found",
            });
          }
          const [bookInOrder, bookInCardDetail] = await Promise.all([
            Order.findOne({
              where: {
                items: {
                  [Op.like]: `%${book_id}%`,
                },
              },
            }),
            CartDetail.findOne({ where: { book_id } }),
          ]);

          if (bookInOrder) {
            return res.json({
              status: "0",
              message: "Sách này đang có đơn hàng, không thể xoá",
            });
          }

          if (bookInCardDetail) {
            return res.json({
              status: "0",
              message: "Sách này đang có thẻ chi tiết, không thể xoá",
            });
          }

          await Book.destroy({ where: { book_id } });
          return res.json({
            status: "1",
            message: msg_success,
          });
        } catch (error) {
          console.log("/api/book/delete error: ", error);
          res.json({ status: "0", message: msg_fail });
        }
      });
    });
  });

  // viết 1 api cho màn home trả về 2 danh sách:
  // 1. sách mới xuất bản
  // 2. sách bán chạy
  app.post(
    "/api/home/get-list-book",
    // helpers.authorization,
    async (req, res) => {
      try {
        const [newBooks, bestSellerBooks, mostViewBooks, randomBooks] =
          await Promise.all([
            Book.findAll({
              where: {
                quantity: { [Sequelize.Op.gt]: 0 },
                publication_year: new Date().getFullYear(),
              },
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
              limit: 8,
            }),
          ]);

        const newBooksData = await Promise.all(
          newBooks.map(async (book) => {
            const author = await Author.findOne({
              where: { author_id: book.author_id },
            });

            if (author)
              return {
                book_id: book.book_id,
                title: book.title,
                author_name: author.author_name || "",
                description: book.description,
                publication_year: book.publication_year,
                book_avatar: book.book_avatar,
                old_price: book.old_price,
                new_price: book.new_price,
                discount_percentage: Math.round(
                  ((book.old_price - book.new_price) / book.old_price) * 100
                ),
                views_count: book.views_count,
                purchase_count: Math.abs(book.purchase_count),
                used_books: book.used_books,
                rate_book: book.rate_book,
                quantity: book.quantity,
              };
          })
        );

        const bestSellerBooksData = await Promise.all(
          bestSellerBooks.map(async (book) => {
            const author = await Author.findOne({
              where: { author_id: book.author_id },
            });

            if (author)
              return {
                book_id: book.book_id,
                title: book.title,
                author_name: author.author_name,
                description: book.description,
                publication_year: book.publication_year,
                book_avatar: book.book_avatar,
                old_price: book.old_price,
                new_price: book.new_price,
                discount_percentage: Math.round(
                  ((book.old_price - book.new_price) / book.old_price) * 100
                ),
                views_count: book.views_count,
                purchase_count: book.purchase_count,
                used_books: book.used_books,
                rate_book: book.rate_book,
                quantity: book.quantity,
              };
          })
        );

        const mostViewBooksData = await Promise.all(
          mostViewBooks.map(async (book) => {
            const author = await Author.findOne({
              where: { author_id: book.author_id },
            });
            if (author)
              return {
                book_id: book.book_id,
                title: book.title,
                author_name: author.author_name,
                description: book.description,
                publication_year: book.publication_year,
                book_avatar: book.book_avatar,
                old_price: book.old_price,
                new_price: book.new_price,
                discount_percentage: Math.round(
                  ((book.old_price - book.new_price) / book.old_price) * 100
                ),
                views_count: book.views_count,
                purchase_count: book.purchase_count,
                used_books: book.used_books,
                rate_book: book.rate_book,
                quantity: book.quantity,
              };
          })
        );

        const randomBooksData = await Promise.all(
          randomBooks.map(async (book) => {
            return {
              book_id: book.book_id,
              title: book.title,
              author_name: book.author_name,
              description: book.description,
              publication_year: book.publication_year,
              book_avatar: book.book_avatar,
              old_price: book.old_price,
              new_price: book.new_price,
              discount_percentage: Math.round(
                ((book.old_price - book.new_price) / book.old_price) * 100
              ),
              views_count: book.views_count,
              purchase_count: book.purchase_count,
              used_books: book.used_books,
              rate_book: book.rate_book,
              quantity: book.quantity,
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
    }
  );

  app.post("/api/book/get-detail", async (req, res) => {
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

          // Lấy thông tin tác giả, danh mục và đánh giá của sách
          const [author, category, reviews] = await Promise.all([
            Author.findOne({ where: { author_id: book.author_id } }),
            Category.findOne({ where: { category_id: book.category_id } }),
            sequelizeHelpers.query(
              `SELECT reviews.review_id, reviews.rating, reviews.comment, reviews.review_images, reviews.created_at, users.username, users.avatar
               FROM reviews
               INNER JOIN users ON reviews.user_id = users.user_id
               WHERE reviews.book_id = ${req.body.book_id}
               ORDER BY reviews.created_at DESC, reviews.rating DESC
               LIMIT 5;`
            ),
          ]);

          if (!author || !category) {
            return res.json({
              status: "0",
              message: "Author or category not found",
            });
          }

          // Nếu không có đánh giá nào, trả về thông báo cùng thông tin sách
          if (reviews.length === 0) {
            return res.json({
              status: "1",
              message: "No reviews found for this book",
              data: {
                book_id: book.book_id,
                title: book.title,
                author_name: author.author_name,
                category_name: category.category_name,
                description: book.description,
                publication_year: book.publication_year,
                book_avatar: book.book_avatar,
                old_price: book.old_price,
                new_price: book.new_price,
                avatar_reviews: stringToArray(book.avatar_reviews),
                discount_percentage: Math.round(
                  ((book.old_price - book.new_price) / book.old_price) * 100
                ),
                views_count: book.views_count,
                purchase_count: book.purchase_count,
                used_books: book.used_books,
                quantity: book.quantity,
                rate_book: book.rate_book,
                reviews: [], // Không có đánh giá
              },
            });
          }

          // Dữ liệu trả về, bao gồm thông tin sách và đánh giá
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
            avatar_reviews: stringToArray(book.avatar_reviews),
            discount_percentage: Math.round(
              ((book.old_price - book.new_price) / book.old_price) * 100
            ),
            views_count: book.views_count,
            purchase_count: Math.abs(book.purchase_count),
            used_books: book.used_books,
            quantity: book.quantity,
            rate_book: book.rate_book,
            reviews: reviews[0], // Lấy đánh giá từ kết quả query, chỉ lấy review có book_id khớp
          };

          return res.json({
            status: "1",
            message: "Lấy thông tin sách và đánh giá thành công",
            data,
          });
        } catch (error) {
          console.log("/api/book/get-detail error: ", error);
          res.json({ status: "0", message: "Lỗi hệ thống" });
        }
      });
    });
  });

  app.post(
    "/api/avatar_reviews/get",
    // helpers.authorization,
    async (req, res) => {
      const { page = 1, limit = 10, query = {} } = req.body;
      const { book_id } = query;

      if (!book_id) {
        return res.status(400).json({
          status: "0",
          message: "book_id is required",
        });
      }

      const offset = (page - 1) * limit;

      try {
        const avatarReviews = await AvatarReview.findAndCountAll({
          where: { book_id },
          limit,
          offset,
        });

        if (avatarReviews.rows.length === 0) {
          return res.status(404).json({
            status: "0",
            message: "No avatar reviews found for this book_id",
          });
        }

        return res.json({
          status: "1",
          message: "Success",
          data: avatarReviews.rows,
          total: avatarReviews.count,
          page,
          totalPages: Math.ceil(avatarReviews.count / limit),
        });
      } catch (error) {
        console.log("/api/avatar_reviews/get error: ", error);
        return res.status(500).json({
          status: "0",
          message: "Server error",
        });
      }
    }
  );
};
