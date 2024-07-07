const db = require("./../helpers/db_helpers");
const helper = require("./../helpers/helpers");
const multiparty = require("multiparty"); //npm i multiparty
const fs = require("fs");
const { sendOTPEmail } = require("../helpers/email_helpers");
const jwt = require("../Service/jwt");
module.exports.controller = (app, io, socket_list) => {
  const msg_success = "successfully";
  const msg_fail = "fail";
  const msg_invalidUser = "invalid username and password";

  app.post("/api/login", (req, res) => {
    helper.Dlog(req.body);
    var reqObj = req.body;

    helper.CheckParameterValid(res, reqObj, ["email", "password"], () => {
      db.query(
        'SELECT `user_id`, `email`, `created_date`, `user_status` FROM `users` WHERE `email` = ? AND  `password` = ? AND `user_status` = "1" ',
        [reqObj.email, reqObj.password],
        (err, result) => {
          if (err) {
            helper.ThrowHtmlError(err, res);
            return;
          }

          if (result.length > 0) {
            res.json({ status: "1", data: result[0], message: msg_success });
          } else {
            res.json({ status: "0", message: msg_invalidUser });
          }
        }
      );
    });
  });

  app.post("/api/register", (req, res) => {
    helper.Dlog(req.body);
    const { email, password, re_password, verify } = req.body;

    helper.CheckParameterValid(res, reqObj, ["email", "password"], () => {
      db.query(
        "SELECT `user_id`, `email`, `created_date`, `user_status` FROM `users` WHERE `email` = ?",
        [reqObj.email],
        (err, result) => {
          if (err) {
            helper.ThrowHtmlError(err, res);
            return;
          }

          if (result.length > 0) {
            res.json({ status: "0", message: "Email đã tồn tại" });
          } else {
            db.query(
              'INSERT INTO `users` (`email`, `password`, `user_status`) VALUES (?, ?, "1")',
              [reqObj.email, reqObj.password],
              (err, result) => {
                if (err) {
                  helper.ThrowHtmlError(err, res);
                  return;
                }

                res.json({ status: "1", message: msg_success });
              }
            );
          }
        }
      );
    });
  });

  //ADMIN
  app.post("/api/admin/login", (req, res) => {
    helper.Dlog(req.body);
    var reqObj = req.body;

    helper.CheckParameterValid(res, reqObj, ["email", "password"], () => {
      db.query(
        'SELECT `user_id`, `email`, `created_at`, `user_status`, `role`  FROM `users` WHERE `email` = ? AND  `password` = ? AND `user_status` = "1" AND (`role` = "admin" OR `role` = "member")',
        [reqObj.email, reqObj.password],
        async (err, result) => {
          if (err) {
            helper.ThrowHtmlError(err, res);
            return;
          }
          if (result.length < 0) {
            return res.json({ status: "0", message: msg_invalidUser });
          }
          try {
            const user = result[0];
            const obj = {
              user_id: user.user_id,
              role: user.role,
              created_at: Date.now(),
            };
            const token = jwt.sign(obj);
            if (!token) {
              return res.json({ status: "0", message: msg_fail });
            }

            return res.json({
              status: "1",
              data: {
                user: user,
                token: token,
              },
              message: msg_success,
            });
          } catch (error) {
            return res.json({ status: "0", message: msg_fail });
          }
        }
      );
    });
  });
};
