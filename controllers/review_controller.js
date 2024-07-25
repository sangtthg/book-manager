const helpers = require("../helpers/helpers");
const sequelizeHelpers = require("../helpers/sequelize_helpers");
const { uploadMultipleFilesToCloud } = require("../helpers/upload_helpers");
const Book = require("../models/book_model");
const CartDetail = require("../models/cart_detail_model");
const Review = require("../models/review_model");
const User = require("../models/user_model");
const upload = require("../Service/upload");
const { arrayToString, stringToArray } = require("../utilities/string/string");
const msg_success = "successfully";
const msg_fail = "fail";

module.exports.controller = (app, io, socket_list) => {
  app.post(
      "/api/review/add",
      helpers.authorization,
      upload.array("review_images"),
      async (req, res) => {
        const reqObj = req.body;
        helpers.CheckParameterValid(
            res,
            reqObj,
            ["book_id", "rating", "comment"],
            async () => {
              helpers.CheckParameterNull(
                  res,
                  reqObj,
                  ["book_id", "rating", "comment"],
                  async () => {
                    try {
                      const { book_id, rating, comment } = reqObj;

                      if (rating < 1 || rating > 5) {
                        return res.json({
                          status: "0",
                          message: "Rating không hợp lệ (1-5)",
                        });
                      }

                      if (req.files.length > 5) {
                        return res.json({
                          status: "0",
                          message: "Số lượng ảnh không được vượt quá 5",
                        });
                      }

                      const book = await Book.findOne({ where: { book_id } });

                      if (!book) {
                        return res.json({
                          status: "0",
                          message: "Book không tồn tại",
                        });
                      }

                      const uploads = await uploadMultipleFilesToCloud(req.files);

                      const reviewImagesString = arrayToString(uploads);

                      console.log(reviewImagesString);
                      const review = await Review.create({
                        book_id,
                        user_id: req.auth.user_id,
                        rating,
                        comment,
                        review_images: reviewImagesString,
                      });

                      return res.json({
                        status: "1",
                        message: "Thêm review thành công",
                        review,
                      });
                    } catch (error) {
                      console.log("error: ", error);
                      return res.json({
                        status: "0",
                        message: "Lỗi hệ thống",
                      });
                    }
                  }
              );
            }
        );
      }
  );

  app.post("/api/review/get", helpers.authorization, async (req, res) => {
    const reqObj = req.body;
    helpers.CheckParameterValid(res, reqObj, ["book_id"], async () => {
      helpers.CheckParameterNull(res, reqObj, ["book_id"], async () => {
        try {
          const { book_id, page = 1, limit = 10 } = reqObj;
          const offset = (page - 1) * limit;
          const reviews = await Review.findAll({
            attributes: { exclude: ["book_id", "user_id"] },
            where: { book_id },
            include: [{ model: User, attributes: ["username", "avatar"] }],
            order: [["created_at", "DESC"]],
            limit,
            offset,
          });
          const transformedReviews = reviews.map((review) => {
            return {
              review_id: review.review_id,
              rating: review.rating,
              comment: review.comment,
              username: review.User.username,
              user_avatar: review.User.avatar,
              review_images: stringToArray(review.review_images),
              created_at: review.created_at,
            };
          });

          return res.json({
            status: "1",
            message: "Lấy review thành công",
            reviews: {
              total: transformedReviews.length,
              data: transformedReviews,
            },
          });
        } catch (error) {
          console.log("error: ", error);
          return res.json({
            status: "0",
            message: "Lỗi hệ thống",
          });
        }
      });
    });
  });

  // delete review

  app.post("/api/review/delete", helpers.authorization, async (req, res) => {
    const reqObj = req.body;
    helpers.CheckParameterValid(res, reqObj, ["review_id"], async () => {
      helpers.CheckParameterNull(res, reqObj, ["review_id"], async () => {
        try {
          const { review_id } = reqObj;
          const review = await Review.findOne({
            where: { review_id },
          });

          if (!review) {
            return res.json({
              status: "0",
              message: "Review không tồn tại",
            });
          }

          if (review.user_id !== req.auth.user_id) {
            return res.json({
              status: "0",
              message: "Bạn không có quyền xóa review này",
            });
          }

          await Review.destroy({ where: { review_id } });

          return res.json({
            status: "1",
            message: "Xóa review thành công",
          });
        } catch (error) {
          console.log("error: ", error);
          return res.json({
            status: "0",
            message: "Lỗi hệ thống",
          });
        }
      });
    });
  });
};