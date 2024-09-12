const { Op } = require("sequelize");
const helpers = require("../helpers/helpers");
const Author = require("../models/author_model");
const Book = require("../models/book_model");
const User = require("../models/user_model");
const { selectUser } = require("../Service/user");
const { uppercase } = require("../utilities/string/uppercase");
const db_helpers = require("../helpers/db_helpers");
const msg_success = "successfully";
const msg_fail = "fail";

module.exports.controller = (app, io, socket_list) => {
  app.post("/api/author/add", helpers.authorization, (req, res) => {
    helpers.CheckParameterValid(res, req.body, ["name"], async () => {
      const user = await selectUser(req.auth.user_id);
      if (user.role === "user") {
        return res.json({
          status: "0",
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      if (!req.body.name || req.body.name === "") {
        return res.json({
          status: "0",
          message: "Name không được để trống",
        });
      }

      const checkUniqueName = await Author.findOne({
        where: {
          author_name: req.body.name,
        },
      });
      if (checkUniqueName) {
        return res.json({
          status: "0",
          message: "Name đã tồn tại",
        });
      }
      const author = await Author.create({
        author_name: uppercase(req.body.name),
        created_by: req.auth.user_id,
      });
      if (author) {
        return res.json({
          status: "1",
          message: msg_success,
          data: author,
        });
      }
    });
  });

  //update author
  app.post("/api/author/update", helpers.authorization, (req, res) => {
    helpers.CheckParameterValid(res, req.body, ["id", "name"], async () => {
      const user = await selectUser(req.auth.user_id);
      if (user.role === "user") {
        return res.json({
          status: "0",
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      if (!req.body.name || req.body.name === "") {
        return res.json({
          status: "0",
          message: "Name không được để trống",
        });
      }

      const checkUniqueName = await Author.findOne({
        where: {
          author_name: req.body.name,
        },
      });
      if (checkUniqueName) {
        return res.json({
          status: "0",
          message: "Name đã tồn tại",
        });
      }

      const author = await Author.update(
        {
          author_name: uppercase(req.body.name),
          updated_by: req.auth.user_id,
        },
        {
          where: {
            author_id: req.body.id,
          },
        }
      );
      if (author) {
        return res.json({
          status: "1",
          message: msg_success,
        });
      }
    });
  });

  app.post("/api/author/delete", helpers.authorization, (req, res) => {
    helpers.CheckParameterValid(res, req.body, ["author_id"], async () => {
      const user = await selectUser(req.auth.user_id);
      if (user.role === "user") {
        return res.json({
          status: "0",
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      try {
        // Kiểm tra xem có book nào chứa author này không
        const bookCount = await Book.count({
          where: {
            author_id: req.body.author_id,
          },
        });

        if (bookCount > 0) {
          // Nếu có sách chứa author này, thông báo lỗi
          return res.json({
            status: "0",
            message: `Không thể xóa tác giả vì có ${bookCount} sách đang liên kết với tác giả này`,
          });
        }
        const result = await Author.destroy({
          where: {
            author_id: req.body.author_id,
          },
        });

        if (result === 0) {
          return res.json({
            status: "0",
            message: "Không tìm thấy tác giả với ID này",
          });
        }

        return res.json({
          status: "1",
          message: "Xóa tác giả thành công",
        });
      } catch (err) {
        return res.json({
          status: "0",
          message: "Lỗi xảy ra khi xóa tác giả",
        });
      }
    });
  });

  app.post("/api/author/get", helpers.authorization, async (req, res) => {
    const user = req.auth.user;
    if (user.role === "user") {
      return res.json({
        status: "0",
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    const limit = req.body.limit || 10;
    const page = req.body.page || 1;
    const offset = (page - 1) * limit;
    const query = req.body.query || "";
    const sqlQuery = `
    SELECT u.username,a.author_name,a.author_id
    FROM authors a
    JOIN users u ON a.created_by = u.user_id
    WHERE a.author_name LIKE ?
    LIMIT ? OFFSET ?;
  `;
    const args = [
      `%${req.body.query || ""}%`,
      req.body.limit || 10,
      (req.body.page || 1 - 1) * (req.body.limit || 10),
    ];
    db_helpers.query(sqlQuery, args, (error, result) => {
      if (error) {
        return res.json({
          status: "0",
          message: "Lỗi xảy ra khi truy vấn dữ liệu",
        });
      }

      return res.json({
        status: "1",
        message: msg_success,
        data: result,
      });
    });
  });
};
