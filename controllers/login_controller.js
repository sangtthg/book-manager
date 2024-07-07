const db = require("./../helpers/db_helpers");
const helper = require("./../helpers/helpers");
const multiparty = require("multiparty"); //npm i multiparty
const fs = require("fs");
const { sendOTPEmail, verifyOTP } = require("../helpers/email_helpers");
const jwt = require("../Service/jwt");
const { comparePassword, hashPassword } = require("../Service/bcrypt");
const { log } = require("console");
module.exports.controller = (app, io, socket_list) => {
  const msg_success = "successfully";
  const msg_fail = "fail";
  const msg_invalidUser = "invalid username and password";

  app.post("/api/login", (req, res) => {
    helper.Dlog(req.body);
    var reqObj = req.body;

    helper.CheckParameterValid(res, reqObj, ["email", "password"], () => {
      db.query(
        'SELECT * FROM `users` WHERE `email` = ? AND `user_status` = "1"',
        [reqObj.email],
        async (err, result) => {
          if (err) {
            helper.ThrowHtmlError(err, res);
            return;
          }

          if (result.length < 1) {
            res.json({ status: "0", message: msg_invalidUser });
          }
          try {
            const user = result[0];
            const compare = await comparePassword(
              reqObj.password,
              user.password
            );
            console.log("compare", compare);
            if (!compare) {
              return res.json({ status: "0", message: msg_invalidUser });
            }
            const obj = {
              user_id: user.user_id,
              role: user.role,
              created_at: Date.now(),
            };
            const token = jwt.sign(obj);
            if (!token) {
              return res.json({ status: "0", message: msg_fail });
            }
            delete user.password;
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

  //SEND OTP
  app.post("/api/send_otp", (req, res) => {
    helper.Dlog(req.body);
    const reqObj = req.body;
    helper.CheckParameterValid(res, reqObj, ["email"], async () => {
      try {
        await sendOTPEmail(reqObj.email);
        res.json({ status: "1", message: msg_success });
      } catch (error) {
        res.json({ status: "0", message: msg_fail });
      }
    });
  });

  app.post("/api/register", (req, res) => {
    helper.Dlog(req.body);
    const reqObj = req.body;
    helper.CheckParameterValid(
      res,
      reqObj,
      ["email", "password", "re_password", "verify", "username"],
      async () => {
        const { username, email, password, re_password, verify } = reqObj;
        const { otp_id, otp } = verify;
        if (password !== re_password) {
          return res.json({ status: "0", message: "Mật khẩu không khớp" });
        }
        const _verifyOTP = await verifyOTP(otp_id, email, otp);
        if (!_verifyOTP) {
          return res.json({ status: "0", message: "Mã OTP không hợp lệ" });
        }
        db.query(
          "SELECT `user_id`, `email`, `created_at`, `user_status` FROM `users` WHERE `email` = ?",
          [reqObj.email],
          async (err, result) => {
            if (err) {
              helper.ThrowHtmlError(err, res);
              return;
            }

            if (result.length > 0) {
              return res.json({ status: "0", message: "Email đã tồn tại" });
            }
            const passwordCrypt = await hashPassword(password);

            if (!passwordCrypt) {
              return res.json({ status: "0", message: "Lỗi mã hóa mật khẩu" });
            }
            db.query(
              'INSERT INTO `users` (`email`, `password`, `username`, `user_status`, `created_at`, `updated_at`) VALUES (?, ?, ?, "1", NOW(), NOW())',
              [reqObj.email, passwordCrypt, reqObj.username],
              (err, result) => {
                if (err) {
                  helper.ThrowHtmlError(err, res);
                  return;
                }

                res.json({ status: "1", message: msg_success });
              }
            );
          }
        );
      }
    );
  });

  //ADMIN
  app.post("/api/admin/login", (req, res) => {
    helper.Dlog(req.body);
    var reqObj = req.body;

    helper.CheckParameterValid(res, reqObj, ["email", "password"], () => {
      db.query(
        'SELECT * FROM `users` WHERE `email` = ? AND `user_status` = "1" AND (`role` = "admin" OR `role` = "member")',
        [reqObj.email, reqObj.password],
        async (err, result) => {
          if (err) {
            helper.ThrowHtmlError(err, res);
            return;
          }
          if (result.length < 1) {
            res.json({ status: "0", message: msg_invalidUser });
          }
          try {
            const user = result[0];
            console.log("user", user);
            const compare = await comparePassword(
              reqObj.password,
              user.password
            );
            if (!compare) {
              return res.json({ status: "0", message: msg_invalidUser });
            }
            const obj = {
              user_id: user.user_id,
              role: user.role,
              created_at: Date.now(),
            };
            const token = jwt.sign(obj);
            if (!token) {
              return res.json({ status: "0", message: msg_fail });
            }
            delete user.password;
            return res.json({
              status: "1",
              data: {
                user: user,
                token: token,
              },
              message: msg_success,
            });
          } catch (error) {
            console.log("error", error);
            return res.json({ status: "0", message: msg_fail });
          }
        }
      );
    });
  });
};
