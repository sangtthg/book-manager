const { Op } = require("sequelize");
const helpers = require("../helpers/helpers");
const Author = require("../models/author_model");
const { selectUser } = require("../Service/user");
const { uppercase } = require("../utilities/string/uppercase");
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

  app.post("/api/author/get", helpers.authorization, async (req, res) => {
    const user = await selectUser(req.auth.user_id);
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
    const authors = await Author.findAndCountAll({
      where: {
        author_name: {
          [Op.like]: `%${query}%`,
        },
      },
      limit: limit,
      offset: offset,
    });
    if (authors) {
      return res.json({
        status: "1",
        message: msg_success,
        data: authors,
      });
    }
  });
};
