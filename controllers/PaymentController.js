const {
  VnpayTransaction,
  PaymentTransaction,
  Order,
  CartDetail,
} = require("../models");

const paymentCallback = async (req, res) => {
  const { vnp_TransactionStatus, vnp_Amount, vnp_TxnRef } = req.query;
  console.log(req.query, "lih");

  try {
    const vnpay = await VnpayTransaction.findOne({ where: { id: vnp_TxnRef } });

    if (!vnpay) {
      return res
        .status(404)
        .json({ code: 3, message: "Transaction not found" });
    }

    const trans = await PaymentTransaction.findOne({
      where: { orderId: vnpay.order },
    });
    console.log(trans, "trans");

    if (!trans) {
      return res.status(404).json({ code: 4, message: "Order not found" });
    }

    if (vnp_TransactionStatus === "00") {
      await VnpayTransaction.update(
        { status: 1 },
        { where: { id: vnp_TxnRef } }
      );

      await PaymentTransaction.update(
        { status: "success" },
        { where: { orderId: vnpay.order } }
      );
      await Order.update(
        {
          orderStatus: "success",
          paymentStatus: "success",
          statusShip: "wait_for_delivery",
        },
        {
          where: {
            id: trans.orderId,
          },
        }
      );
      const order = await Order.findOne({ where: { id: trans.orderId } });
      if (order) {
        await CartDetail.destroy({
          where: {
            user_id: trans.customerId,
            status: 1,
            cart_id: order.listCartId,
          },
        });
      }
    }

    if (vnp_TransactionStatus === "02") {
      await VnpayTransaction.update(
        { status: 2 },
        { where: { id: vnp_TxnRef } }
      );

      await PaymentTransaction.update(
        { status: "fail" },
        { where: { orderId: vnpay.order } }
      );

      await Order.update(
        {
          orderStatus: "fail",
          paymentStatus: "fail",
          statusShip: "cancel_payment_error",
        },
        { where: { userId: trans.customerId, id: trans.orderId } }
      );
    }

    return res.render("../views/paymentCallback.ejs", {
      order: vnp_TxnRef,
      amount: vnp_Amount / 100,
      status: vnp_TransactionStatus,
    });
  } catch (error) {
    console.error("Payment callback error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = { paymentCallback };
// STATUS: {
//     PROCESSING: -1,
//     REFUND: 0,
//     DONE: 1,
//     FAIL: 2,
//   },
//   TRANSACTION_STATUS: {
//     SUCCESS: "00",
//     PENDING: "01",
//     FAIL: "02",
//     VNP_ERROR: "04", //giao dịch đảo, thành công ở ngân hàng nhg chưa thành công ở VNPAY
//     PENDING_REFUND: "05",
//     SENT_REFUND: "06", //đã gửi yêu cầu hoàn tiền cho ngân hàng
//     SPAM: "07", //nghi vấn hack
//     DENIED_REFUND: "09", //giao dịch hoàn bị từ chối
//   },
