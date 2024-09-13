const db = require("../helpers/db_helpers");
const helper = require("../helpers/helpers");
const { sendOTPEmail, verifyOTP } = require("../helpers/email_helpers");
const jwt = require("../Service/jwt");
const { comparePassword, hashPassword } = require("../Service/bcrypt");
const User = require("../models/user_model");
const OtpTypes = require("../constants/otp_type");
const Otp = require("../models/otp_model");
const msg_success = "successfully";
const msg_fail = "fail";
const msg_invalidUser = "invalid username and password";

const login = async (req, res, isAdmin = true) => {
  helper.Dlog(req.body);
  var reqObj = req.body;

  helper.CheckParameterValid(res, reqObj, ["email", "password"], () => {
    const query = isAdmin
      ? "SELECT * FROM `users` WHERE `email` = ? AND `user_status` = 1 AND (`role` = 'admin' OR `role` = 'member')"
      : "SELECT * FROM `users` WHERE `email` = ? AND `user_status` = 1";
    db.query(query, [reqObj.email], async (err, result) => {
      if (err) {
        helper.ThrowHtmlError(err, res);
        return;
      }

      if (result.length < 1) {
        res.json({ status: "0", message: msg_invalidUser });
      }
      try {
        const user = result[0];
        // check block user
        if (user.is_block) {
          return res.json({
            status: "0",
            message: "Tài khoản của bạn đã bị khóa.",
          });
        }
        const compare = await comparePassword(reqObj.password, user.password);
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
    });
  });
};

module.exports.controller = (app, io, socket_list) => {
  app.post("/api/login", (req, res) => {
    login(req, res, false);
  });

  //SEND OTP
  app.post("/api/send_otp", (req, res) => {
    helper.Dlog(req.body);

    const reqObj = req.body;
    helper.CheckParameterValid(res, reqObj, ["email"], async () => {
      try {
        const db_otp = await sendOTPEmail(reqObj.email, OtpTypes.REGISTER);
        res.json({ status: "1", message: msg_success, data: db_otp });
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
      [
        "email",
        "password",
        "re_password",
        "verify.otp_id",
        "verify.otp",
        "username",
        "address",
      ],
      async () => {
        const { username, email, password, re_password, verify } = reqObj;
        const { otp_id, otp } = verify;
        if (password !== re_password) {
          return res.json({ status: "0", message: "Mật khẩu không khớp" });
        }
        const _verifyOTP = await verifyOTP(
          otp_id,
          email,
          otp,
          OtpTypes.REGISTER
        );
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
              "INSERT INTO `users` (`email`, `password`, `username`, `user_status`, `created_at`, `updated_at`) VALUES (?, ?, ?, 1, NOW(), NOW())",
              [reqObj.email, passwordCrypt, reqObj.username],
              (err, result) => {
                if (err) {
                  console.log("/api/register", err);
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

  app.post("/api/otp/forgot_password", (req, res) => {
    helper.Dlog(req.body);
    const reqObj = req.body;
    helper.CheckParameterValid(res, reqObj, ["email"], async () => {
      const { email } = reqObj;
      db.query(
        "SELECT `user_id`, `email`, `created_at`, `user_status` FROM `users` WHERE `email` = ?",
        [email],
        async (err, result) => {
          if (err) {
            helper.ThrowHtmlError(err, res);
            return;
          }

          if (result.length < 1) {
            return res.json({ status: "0", message: "Email không tồn tại" });
          }
          const user = result[0];
          const otp = await sendOTPEmail(email, OtpTypes.FORGOT_PASSWORD);
          res.json({ status: "1", message: msg_success, data: otp });
        }
      );
    });
  });

  app.post("/api/otp/verify_forgot_password", (req, res) => {
    helper.Dlog(req.body);
    const reqObj = req.body;
    helper.CheckParameterValid(
      res,
      reqObj,
      ["email", "otp_id", "otp"],
      async () => {
        const { email, otp_id, otp } = reqObj;
        const verify = await verifyOTP(
          otp_id,
          email,
          otp,
          OtpTypes.FORGOT_PASSWORD
        );
        if (!verify) {
          return res.json({ status: "0", message: "Mã OTP không hợp lệ" });
        }
        return res.json({ status: "1", message: msg_success });
      }
    );
  });

  // app.post("/api/forgot_password", (req, res) => {
  //   helper.Dlog(req.body);
  //   const reqObj = req.body;
  //   helper.CheckParameterValid(
  //     res,
  //     reqObj,
  //     ["verify", "verify.email", "password", "re_password"],
  //     async () => {
  //       const { password, re_password } = reqObj;
  //       const { email } = reqObj.verify;

  //       if (password !== re_password) {
  //         return res.json({ status: "0", message: "Mật khẩu không khớp" });
  //       }

  //       const otp = await Otp.findOne({
  //         where: { email, type: OtpTypes.FORGOT_PASSWORD },
  //       });
  //       if (!otp) {
  //         return res.json({ status: "0", message: "Mã OTP không hợp lệ" });
  //       }

  //       const passwordCrypt = await hashPassword(password);
  //       if (!passwordCrypt) {
  //         return res.json({ status: "0", message: "Lỗi mã hóa mật khẩu" });
  //       }

  //       db.query(
  //         "UPDATE `users` SET `password` = ? WHERE `email` = ?",
  //         [passwordCrypt, email],
  //         (err, result) => {
  //           console.log(result);
  //           if (err) {
  //             console.log("/api/forgot_password", err);
  //             res.json({ status: "0", message: msg_fail });
  //             return;
  //           }
  //           res.json({ status: "1", message: msg_success });
  //         }
  //       );
  //     }
  //   );
  // });
  app.post("/api/verify_otp_forgot_password", async (req, res) => {
    const { email, otp, otp_id } = req.body; // Bổ sung otp_id vào body

    if (!email || !otp || !otp_id) {
      return res.json({ status: "0", message: "Thiếu email, otp hoặc otp_id" });
    }

    try {
      // Tìm mã OTP trong cơ sở dữ liệu dựa trên otp_id, email, otp và type
      const otpRecord = await Otp.findOne({
        where: {
          email: email,
          otp: otp,
          id: otp_id,
          type: OtpTypes.FORGOT_PASSWORD,
        },
      });

      if (!otpRecord) {
        return res.json({
          status: "0",
          message: "Mã OTP hoặc OTP ID không hợp lệ",
        });
      }

      res.json({
        status: "1",
        message: msg_success,
      });
    } catch (error) {
      console.error("Lỗi khi kiểm tra OTP: ", error);
      res.json({ status: "0", message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
  });

  app.post("/api/forgot_password", async (req, res) => {
    const { otp_id, otp, password, re_password } = req.body;

    if (!otp_id || !otp || !password || !re_password) {
      return res.json({
        status: "0",
        message: "Thiếu otp_id, otp, mật khẩu hoặc xác nhận mật khẩu",
      });
    }

    if (password !== re_password) {
      return res.json({
        status: "0",
        message: "Mật khẩu và xác nhận mật khẩu không khớp",
      });
    }

    try {
      // Kiểm tra xem otp_id và otp có hợp lệ không
      const otpRecord = await Otp.findOne({
        where: { id: otp_id, otp, type: OtpTypes.FORGOT_PASSWORD },
      });

      if (!otpRecord) {
        return res.json({
          status: "0",
          message: "otp_id hoặc otp không hợp lệ",
        });
      }

      // Mã hóa mật khẩu mới
      const passwordCrypt = await hashPassword(password);
      if (!passwordCrypt) {
        return res.json({ status: "0", message: "Lỗi mã hóa mật khẩu" });
      }

      // Cập nhật mật khẩu mới trong cơ sở dữ liệu theo email từ otpRecord
      db.query(
        "UPDATE `users` SET `password` = ? WHERE `email` = ?",
        [passwordCrypt, otpRecord.email], // Lấy email từ bản ghi OTP
        (err, result) => {
          if (err) {
            console.error("/api/change_password", err);
            return res.json({
              status: "0",
              message: "Cập nhật mật khẩu thất bại",
            });
          }
          res.json({ status: "1", message: "Cập nhật mật khẩu thành công" });
        }
      );
    } catch (error) {
      console.error("Lỗi khi thay đổi mật khẩu:", error);
      res.json({ status: "0", message: "Lỗi xác thực, vui lòng thử lại" });
    }
  });

  //ADMIN
  app.post("/api/admin/login", (req, res) => {
    login(req, res, true);
  });
};
