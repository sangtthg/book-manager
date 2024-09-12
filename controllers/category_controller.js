const db = require("../helpers/db_helpers");
const helper = require("../helpers/helpers");
const { selectUser } = require("../Service/user");
const msg_success = "successfully";
const msg_fail = "fail";
const msg_invalidUser = "invalid username and password";

const checkUniqueName = (name) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM categories WHERE category_name = '${formatName(
      name
    )}'`;
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      if (result.length > 0) {
        resolve(false);
      }
      resolve(true);
    });
  });
};

const formatName = (name) => {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

module.exports.controller = (app, io, socket_list) => {
  app.post("/api/category/add", helper.authorization, (req, res) => {
    helper.CheckParameterValid(res, req.body, ["name"], async () => {
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
          message: "Category name không được để trống",
        });
      }
      const checkName = await checkUniqueName(req.body.name);
      if (!checkName) {
        return res.json({
          status: "0",
          message: "Category name đã tồn tại",
        });
      }
      const query = `INSERT INTO categories (category_name, created_by) VALUES ('${formatName(
        req.body.name
      )}', '${req.auth.user_id}')`;
      db.query(query, (err, result) => {
        if (err) {
          return res.json({
            status: "0",
            message: msg_fail,
          });
        }
        return res.json({
          status: "1",
          message: msg_success,
        });
      });
    });
  });

  app.post("/api/category/update", helper.authorization, (req, res) => {
    helper.CheckParameterValid(
      res,
      req.body,
      ["name", "category_id"],
      async () => {
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
            message: "Category name không được để trống",
          });
        }
        const checkName = await checkUniqueName(req.body.name);
        if (!checkName) {
          return res.json({
            status: "0",
            message: "Category name đã tồn tại",
          });
        }

        const query = `UPDATE categories SET category_name = '${formatName(
          req.body.name
        )}' WHERE category_id = '${req.body.category_id}'`;
        db.query(query, (err, result) => {
          if (err) {
            return res.json({
              status: "0",
              message: msg_fail,
            });
          }
          return res.json({
            status: "1",
            message: msg_success,
          });
        });
      }
    );
  });

  // delete
  app.post("/api/category/delete", helper.authorization, (req, res) => {
    helper.CheckParameterValid(res, req.body, ["category_id"], async () => {
      const user = await selectUser(req.auth.user_id);
      if (user.role === "user") {
        return res.json({
          status: "0",
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }
      // check book có chứa category
      const checkBooksQuery = `SELECT COUNT(*) AS bookCount FROM books WHERE category_id = '${req.body.category_id}'`;
      db.query(checkBooksQuery, (err, result) => {
        if (err) {
          return res.json({
            status: "0",
            message: "Lỗi khi kiểm tra books",
          });
        }

        const bookCount = result[0].bookCount;
        if (bookCount > 0) {
          // Nếu có sách chứa category này, thông báo lỗi
          return res.json({
            status: "0",
            message: `Không thể xóa category vì có ${bookCount} sách đang chứa thể loại này`,
          });
        }

        // Sau khi cập nhật book thành công, xóa category
        const deleteCategoryQuery = `DELETE FROM categories WHERE category_id = '${req.body.category_id}'`;
        db.query(deleteCategoryQuery, (err, result) => {
          if (err) {
            return res.json({
              status: "0",
              message: msg_fail,
            });
          }

          // Kiểm tra xem có category nào bị xóa không
          if (result.affectedRows === 0) {
            return res.json({
              status: "0",
              message: "Không tìm thấy category với ID này",
            });
          }

          return res.json({
            status: "1",
            message: "Xóa category thành công và cập nhật books",
          });
        });
      });
    });
  });

  //GET
  // app.post("/api/category/get", helper.authorization, (req, res) => {
  //   const query = `SELECT * FROM categories`;
  //   db.query(query, (err, result) => {
  //     if (err) {
  //       return res.json({
  //         status: "0",
  //         message: msg_fail,
  //       });
  //     }
  //     return res.json({
  //       status: "1",
  //       message: msg_success,
  //       data: result,
  //     });
  //   });
  // });
  app.post("/api/category/get", helper.authorization, (req, res) => {
    const limit = req.body.limit || 10;
    const page = req.body.page || 1;
    const offset = (page - 1) * limit;
    const query = req.body.query || "";

    const sqlQuery = `
      SELECT c.category_id, c.category_name, u.username AS created_by_username
      FROM categories c
      LEFT JOIN users u ON c.created_by = u.user_id
      WHERE c.category_name LIKE ?
      LIMIT ? OFFSET ?;
    `;

    const args = [
      `%${query}%`, // Search query
      limit, // Limit
      offset, // Offset
    ];

    db.query(sqlQuery, args, (err, result) => {
      if (err) {
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
