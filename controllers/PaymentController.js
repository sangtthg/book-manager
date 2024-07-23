const { VnpayTransaction, PaymentTransaction, Order } = require("../models");

const paymentCallback = async (req, res) => {
  const { vnp_TransactionStatus, vnp_Amount, vnp_TxnRef } = req.query;
  console.log(req.query);

  try {
    const vnpay = await VnpayTransaction.findOne({ where: { id: vnp_TxnRef } });

    if (!vnpay) {
      return res
        .status(404)
        .json({ code: 3, message: "Transaction not found" });
    }

    const trans = await PaymentTransaction.findOne({
      where: { id: vnpay.order },
    });

    if (!trans) {
      return res.status(404).json({ code: 4, message: "Order not found" });
    }

    if (vnp_TransactionStatus === "00") {
      await VnpayTransaction.update(
        { status: VnpayTransaction.STATUS.DONE },
        { where: { id: vnp_TxnRef } }
      );

      await PaymentTransaction.update(
        { status: "success" },
        { where: { id: vnpay.order } }
      );
      await Order.update(
        {
          orderStatus: "success",
        },
        {
          where: {
            id: trans.orderId,
          },
        }
      );
    }

    if (vnp_TransactionStatus === "02") {
      await VnpayTransaction.update(
        { status: VnpayTransaction.STATUS.FAIL },
        { where: { id: vnp_TxnRef } }
      );

      await PaymentTransaction.update(
        { status: "fail" },
        { where: { id: vnpay.order } }
      );

      await Order.update(
        {
          status: "Cancelled",
          date: 0,
          startTime: 0,
          noteCancel: "Hủy thanh toán!",
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
