const helper = require("../helpers/helpers");
const {
  verifyOTP,
  sendMail,
  sendOTPEmail,
} = require("../helpers/email_helpers");
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
const OtpTypes = require("../constants/otp_type");
const { where } = require("sequelize/lib/sequelize");
module.exports.controller = (app, io, socket_list) => {
  app.post(
    //
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
  /// member/updadte
  app.post(
    "/api/user/member/update",
    helper.authorization,
    upload.single("avatar"),
    helper.checkRole,
    async (req, res) => {
      try {
        const user = req.auth.user;

        const isSex = checkSex(req.body.sex || user.sex);

        if (!isSex) {
          return res.json({
            status: "0",
            message: "Giới tính không hợp lệ",
          });
        }

        const avatar = !req.file
          ? user.avatar
          : await uploadFileToCloud(req.file);

        User.update(
          {
            username: req.body.username || user.username,
            avatar: avatar || avatarDefault,
            sex: req.body.sex || user.sex,
            is_block: req.body.is_block || user.is_block, /// is_block
            updated_at: new Date(),
          },
          {
            where: {
              user_id: user.user_id,
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

  app.post(
    "/api/user/update",
    helper.authorization,
    upload.single("avatar"),
    helper.checkRole,
    (req, res) => {
      helper.CheckParameterValid(
        res,
        req.body,
        ["user_id", "email", "role", "username", "sex", "is_block"],
        async () => {
          helper.CheckParameterNull(
            res,
            req.body,
            ["user_id", "email", "role", "username", "sex", "is_block"],
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
                    is_block: req.body.is_block,
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
      ["password", "new_password", "re_password"],
      async () => {
        const { password, new_password, re_password } = reqObj;

        if (new_password !== re_password) {
          return res.json({ status: "0", message: "Mật khẩu không khớp" });
        }

        const user = (
          await User.findOne({ where: { user_id: req.auth.user_id } })
        ).get();

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
  // delete

  app.post(
    "/api/user/delete",
    helper.authorization,
    helper.checkRole,
    async (req, res) => {
      try {
        const { user_id, role } = req.body;

        if (role !== "admin" && role !== "member") {
          return res.status(403).json({
            status: "0",
            message: "Bạn không có quyền thực hiện hành động này",
          });
        }

        // Kiểm tra người dùng có tồn tại không
        const user = await User.findOne({ where: { user_id } });

        if (!user) {
          return res.json({
            status: "0",
            message: "Người dùng không tồn tại.",
          });
        }

        // Xóa người dùng
        await User.destroy({ where: { user_id } });

        res.json({
          status: "1",
          message: "Người dùng đã được xóa thành công.",
        });
      } catch (error) {
        console.log("/api/user/delete", error);
        res.json({ status: "0", message: "Có lỗi xảy ra." });
      }
    }
  );

  // api block  user
  app.post(
    "/api/user/block",
    helper.authorization,
    helper.checkRole,
    async (req, res) => {
      try {
        const { user_id } = req.body;

        if (req.auth.role === "user") {
          return res.json({
            status: "0",
            message: "Bạn không có quyền thực hiện hành động này",
          });
        }

        const user = await User.findOne({ where: { user_id } });

        if (!user) {
          return res.json({
            status: "0",
            message: "Người dùng không tồn tại.",
          });
        }

        // Cập nhật trạng thái khóa tài khoản
        await User.update({ is_block: true }, { where: { user_id } });

        res.json({
          status: "1",
          message: "Tài khoản đã được khóa thành công.",
        });
      } catch (error) {
        console.log("/api/user/block", error);
        res.json({ status: "0", message: "Có lỗi xảy ra." });
      }
    }
  );
  // mở tài khoản block
  app.post(
    "/api/user/unblock",
    helper.authorization,
    helper.checkRole,
    async (req, res) => {
      try {
        const { user_id } = req.body;

        if (req.auth.role === "user") {
          return res.json({
            status: "0",
            message: "Bạn không có quyền thực hiện hành động này",
          });
        }

        const user = await User.findOne({ where: { user_id } });

        if (!user) {
          return res.json({
            status: "0",
            message: "Người dùng không tồn tại.",
          });
        }

        // Cập nhật trạng thái mở khóa tài khoản
        await User.update({ is_block: false }, { where: { user_id } });

        res.json({
          status: "1",
          message: "Tài khoản đã được mở khóa thành công.",
        });
      } catch (error) {
        console.log("/api/user/unblock", error);
        res.json({ status: "0", message: "Có lỗi xảy ra." });
      }
    }
  );
};
