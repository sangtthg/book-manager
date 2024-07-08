const db = require("../helpers/db_helpers");
const helper = require("../helpers/helpers");
const { sendOTPEmail, verifyOTP } = require("../helpers/email_helpers");
const jwt = require("../Service/jwt");
const { comparePassword, hashPassword } = require("../Service/bcrypt");
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
          message: "You are not authorized to perform this action",
        });
      }

      if (!req.body.name || req.body.name === "") {
        return res.json({
          status: "0",
          message: "Category name is required",
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
            message: "You are not authorized to perform this action",
          });
        }

        if (!req.body.name || req.body.name === "") {
          return res.json({
            status: "0",
            message: "Category name is required",
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
};
