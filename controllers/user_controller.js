const helper = require("../helpers/helpers");
const { verifyOTP, sendMail } = require("../helpers/email_helpers");
const { comparePassword, hashPassword } = require("../Service/bcrypt");
const { selectUser } = require("../Service/user");
const User = require("../models/user_model");
const { Op } = require("sequelize");
const upload = require("../Service/upload");
const { uploadFileToCloud } = require("../helpers/upload_helpers");
const { regexEmail } = require("../Service/regex");
const {
  roles,
  msg_fail,
  msg_success,
  avatarDefault,
} = require("../constants/common");
const { checkSex } = require("../utilities/int/check_sex");
module.exports.controller = (app, io, socket_list) => {
  app.post(
    "/api/user/get",
    helper.authorization,
    helper.checkRole,
    (req, res) => {
      const limit = req.body.limit || 10;
      const page = req.body.page || 1;
      const offset = (page - 1) * limit;
      //lấy ra theo option trên nhưng trừ trường password và trừ chính user đó
      helper.CheckParameterValid(res, req.body, ["query.roles"], async () => {
        helper.CheckParameterNull(res, req.body, ["query.roles"], async () => {
          const limit = req.body.limit || 10;
          const page = req.body.page || 1;
          const offset = (page - 1) * limit;
          const roles = req.body.query.roles;
          const search = req.body.query.search || "";

          const whereRoleObj = roles.length > 0 ? { role: roles } : {};
          User.findAll({
            attributes: { exclude: ["password"] },
            where: {
              user_id: {
                [Op.ne]: req.auth.user_id,
              },
              ...whereRoleObj,
              [Op.or]: {
                email: {
                  [Op.like]: `%${search}%`,
                },
                username: {
                  [Op.like]: `%${search}%`,
                },
              },
            },
            limit: limit,
            offset: offset,
          })
            .then((result) => {
              res.json({ status: "1", message: msg_success, data: result });
            })
            .catch((err) => {
              console.log("/api/users/get", err);
              res.json({ status: "0", message: msg_fail });
            });
        });
      });
    }
  );

  app.post(
    "/api/user/getadmin",
    helper.authorization,
    helper.checkRole,
    (req, res) => {
      const limit = req.body.limit || 10;
      const page = req.body.page || 1;
      const offset = (page - 1) * limit;
      //lấy ra theo option trên nhưng trừ trường password và trừ chính user đó
      User.findAll({
        attributes: { exclude: ["password"] },
        where: {
          user_id: {
            [Op.ne]: req.auth.user_id,
          },
          role: "admin",
        },
        limit: limit,
        offset: offset,
      })
        .then((result) => {
          res.json({ status: "1", message: msg_success, data: result });
        })
        .catch((err) => {
          console.log("/api/users/get", err);
          res.json({ status: "0", message: msg_fail });
        });
    }
  );
  app.post(
    "/api/user/add",
    helper.authorization,
    upload.single("avatar"),
    helper.checkRole,
    (req, res) => {
      helper.CheckParameterValid(
        res,
        req.body,
        ["email", "role", "username", "sex"],
        async () => {
          helper.CheckParameterNull(
            res,
            req.body,
            ["email", "role", "username", "sex"],
            async () => {
              try {
                const user = await selectUser(req.auth.user_id);
                if (user.role === "user") {
                  return res.json({
                    status: "0",
                    message: "Bạn không có quyền thực hiện hành động này",
                  });
                }
                if (regexEmail(req.body.email) === false) {
                  return res.json({
                    status: "0",
                    message: "Email không hợp lệ",
                  });
                }
                const checkEmail = await User.findOne({
                  where: { email: req.body.email },
                });
                if (checkEmail) {
                  return res.json({
                    status: "0",
                    message: "Email đã tồn tại",
                  });
                }
                if (roles.indexOf(req.body.role) === -1) {
                  return res.json({
                    status: "0",
                    message: "Role không hợp lệ",
                  });
                }

                const isSex = checkSex(req.body.sex);
                if (!isSex) {
                  return res.json({
                    status: "0",
                    message: "Giới tính không hợp lệ",
                  });
                }
                const avatar = await uploadFileToCloud(req.file);
                const password = Math.random().toString(36).slice(-8);
                sendMail(req.body.email, "Mật khẩu bạn là", password);
                const hash = await hashPassword(password);
                User.create({
                  email: req.body.email,
                  password: hash,
                  role: req.body.role,
                  username: req.body.username,
                  avatar: avatar || avatarDefault,
                  sex: req.body.sex,
                })
                  .then((result) => {
                    res.json({ status: "1", message: msg_success });
                  })
                  .catch((err) => {
                    console.log("/api/user/add", err);
                    res.json({ status: "0", message: msg_fail });
                  });
              } catch (error) {
                console.log("/api/user/add", error);
                res.json({ status: "0", message: msg_fail });
              }
            }
          );
        }
      );
    }
  );

  app.post(
    "/api/user/update",
    helper.authorization,
    upload.single("avatar"),
    helper.checkRole,
    (req, res) => {
      helper.CheckParameterValid(
        res,
        req.body,
        ["user_id", "email", "role", "username", "sex"],
        async () => {
          helper.CheckParameterNull(
            res,
            req.body,
            ["user_id", "email", "role", "username", "sex"],
            async () => {
              try {
                if (req.auth.role === "user") {
                  return res.json({
                    status: "0",
                    message: "Bạn không có quyền thực hiện hành động này",
                  });
                }
                if (regexEmail(req.body.email) === false) {
                  return res.json({
                    status: "0",
                    message: "Email không hợp lệ",
                  });
                }
                if (roles.indexOf(req.body.role) === -1) {
                  return res.json({
                    status: "0",
                    message: "Role không hợp lệ",
                  });
                }

                const checkEmail = await User.findOne({
                  where: { email: req.body.email },
                });

                if (checkEmail.user_id != req.body.user_id) {
                  return res.json({
                    status: "0",
                    message: "Email đã tồn tại",
                  });
                }

                const isSex = checkSex(req.body.sex);

                if (!isSex) {
                  return res.json({
                    status: "0",
                    message: "Giới tính không hợp lệ",
                  });
                }

                const avatar = await uploadFileToCloud(req.file);

                User.update(
                  {
                    email: req.body.email,
                    role: req.body.role,
                    username: req.body.username,
                    avatar: avatar || checkEmail.avatar || avatarDefault,
                    sex: req.body.sex,
                    updated_at: new Date(),
                  },
                  {
                    where: {
                      user_id: req.body.user_id,
                    },
                  }
                )
                  .then((result) => {
                    res.json({ status: "1", message: msg_success });
                  })
                  .catch((err) => {
                    console.log("/api/user/update", err);
                    res.json({ status: "0", message: msg_fail });
                  });
              } catch (error) {
                console.log("/api/user/update", error);
                res.json({ status: "0", message: msg_fail });
              }
            }
          );
        }
      );
    }
  );

  app.post("/api/user/change-password", helper.authorization, (req, res) => {
    helper.Dlog(req.body);
    const reqObj = req.body;
    helper.CheckParameterValid(
      res,
      reqObj,
      [
        "password",
        "new_password",
        "re_password",
        "verify",
        "verify.otp_id",
        "verify.otp",
      ],
      async () => {
        const { password, new_password, re_password, verify } = reqObj;
        const { otp_id, otp } = verify;
        if (new_password !== re_password) {
          return res.json({ status: "0", message: "Mật khẩu không khớp" });
        }

        const user = (
          await User.findOne({ where: { user_id: req.auth.user_id } })
        ).get();

        const _verifyOTP = await verifyOTP(otp_id, user.email, otp);

        if (!_verifyOTP) {
          return res.json({ status: "0", message: "Mã OTP không hợp lệ" });
        }

        const compare = await comparePassword(password, user.password);

        if (!compare) {
          return res.json({ status: "0", message: msg_invalidUser });
        }
        const passwordCrypt = await hashPassword(new_password);

        if (!passwordCrypt) {
          return res.json({ status: "0", message: "Lỗi mã hóa mật khẩu" });
        }
        const newUser = await User.update(
          { password: passwordCrypt, updated_at: new Date() },
          { where: { user_id: req.auth.user_id } }
        );
        console.log("case 5");

        if (newUser) {
          return res.json({ status: "1", message: msg_success });
        }
        return res.json({ status: "0", message: msg_fail });
      }
    );
  });
};
