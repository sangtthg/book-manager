const helpers = require("../helpers/helpers");
const Book = require("../models/book_model");
const CartDetail = require("../models/cart_detail_model");
const msg_success = "successfully";
const msg_fail = "fail";

module.exports.controller = (app, io, socket_list) => {
  //add cart
  app.post("/api/cart/add", helpers.authorization, (req, res) => {
    const reqObj = req.body;
    helpers.CheckParameterValid(res, reqObj, ["listCart"], async () => {
      const listCart = reqObj.listCart || [];
      const user_id = req.auth.user_id;
      const data = [];
      const listBookId = [];
      for (let index = 0; index < listCart.length; index++) {
        const { book_id, quantity } = listCart[index];
        if (book_id === undefined || quantity === undefined) {
          return res.json({ status: "0", message: "Invalid data" });
        }
        if (quantity < 1) {
          return res.json({ status: "0", message: "Invalid quantity" });
        }
        data.push({
          user_id,
          book_id,
          quantity,
        });
        listBookId.push(book_id);
      }

      if (data.length === 0) {
        return res.json({ status: "0", message: "Invalid data" });
      }

      const books = await Book.findAll({
        where: { book_id: listBookId },
      });

      if (books.length !== listBookId.length) {
        return res.json({ status: "0", message: "Invalid book" });
      }

      CartDetail.bulkCreate(data)
        .then((result) => {
          console.log(result);
          res.json({ status: "1", message: msg_success });
        })
        .catch((err) => {
          console.log("/api/cart/add", err);
          res.json({ status: "0", message: msg_fail });
        });
    });
  });

  app.post("/api/cart/get", helpers.authorization, (req, res) => {
    const user_id = req.auth.user_id;
    const { page = 1, limit = 10 } = req.body;
    const offset = (page - 1) * limit;

    CartDetail.findAndCountAll({
      where: { user_id },
      limit,
      offset,
      include: [
        {
          model: Book,
          required: true,
        },
      ],
      order: [["created_date", "DESC"]],
    })
      .then((result) => {
        res.json({
          status: "1",
          data: { totalAll: result.count, data: result.rows },
        });
      })
      .catch((err) => {
        console.log("/api/cart/get", err);
        res.json({ status: "0", message: msg_fail });
      });
  });

  //total number of cart items
  app.get("/api/cart/total-items", helpers.authorization, async (req, res) => {
    const user_id = req.auth.user_id;

    try {
      const totalItems = await CartDetail.sum('quantity', {
        where: { user_id },
      });

      res.json({
        status: "1",
        message: msg_success,
        totalItems: totalItems || 0,
      });
    } catch (err) {
      console.log("/api/cart/total-items error:", err);
      res.json({ status: "0", message: msg_fail });
    }
  });

  //delete cart
  app.post("/api/cart/delete", helpers.authorization, (req, res) => {
    const reqObj = req.body;
    helpers.CheckParameterValid(res, reqObj, ["listCart"], async () => {
      const listCart = reqObj.listCart || [];
      const user_id = req.auth.user_id;
      const data = [];
      for (let index = 0; index < listCart.length; index++) {
        const { cart_id } = listCart[index];
        if (cart_id === undefined) {
          return res.json({ status: "0", message: "Invalid data" });
        }
        data.push(cart_id);
      }

      if (data.length === 0) {
        return res.json({ status: "0", message: "Invalid data" });
      }

      CartDetail.destroy({
        where: { cart_id: data, user_id },
      })
        .then((result) => {
          console.log(result);
          res.json({ status: "1", message: msg_success });
        })
        .catch((err) => {
          console.log("/api/cart/delete", err);
          res.json({ status: "0", message: msg_fail });
        });
    });
  });
};
