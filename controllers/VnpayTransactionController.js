const moment = require("moment");
const momentTimeZone = require("moment-timezone");
const querystring = require("qs");
const sha256 = require("sha256");
const md5 = require("md5");
const crypto = require("crypto");

const VnpayTransactionController = {
  STATUS: {
    PROCESSING: -1,
    REFUND: 0,
    DONE: 1,
    FAIL: 2,
  },
  TRANSACTION_STATUS: {
    SUCCESS: "00",
    PENDING: "01",
    FAIL: "02",
    VNP_ERROR: "04",
    PENDING_REFUND: "05",
    SENT_REFUND: "06",
    SPAM: "07",
    DENIED_REFUND: "09",
  },

  afterUpdate: async (req, res) => {
    try {
      await VnpayTransactionController.execTransaction(req.body);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  execTransaction: async (instance) => {
    try {
      let clone = {
        transactionId: instance.id,
        customer: instance.customer,
        order: instance.order,
        amount: instance.amount,
        status: instance.status,
      };
      if (instance.payRefundStatus) {
        clone.refundStatus = instance.payRefundStatus;
      }
      // await PaymentTransaction.execTransactionOrder(clone);
    } catch (error) {
      console.error("Error executing transaction:", error);
    }
  },

  createUrl: async (req, res) => {
    try {
      const { order, totalAmount, returnUrl, customer, ipAddress } = req.body;
      let payUrl = await VnpayTransactionController.createPayUrl({
        customer,
        order,
        totalAmount,
        ip: ipAddress,
        merchantReturnUrl: returnUrl,
      });
      res.json({ payUrl });
    } catch (error) {
      res.status(500).send(error);
    }
  },

  createPayUrl: async (opts) => {
    let trans = {};
    let { customer, order, totalAmount, ip, language = "vn", bankCode, isWeb, merchantReturnUrl } = opts;
    if (totalAmount > 0) {
      let ipAddr = ip;
      trans.customer = customer;
      trans.merchantReturnUrl = merchantReturnUrl;
      trans.order = order;
      trans.amount = totalAmount;
      trans.status = VnpayTransactionController.STATUS.PROCESSING;
      trans.isWeb = isWeb || 0;
      trans.expAt = moment().add(10, "minutes").valueOf();
      trans = await VnpayTransaction.create(trans).fetch();
      let tmnCode = "3B82FLAC";
      let secretKey = "S9U05FEO5JS9QZ7TNFHPWPJVA234YCAG";
      let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
      let createDate = momentTimeZone().tz("Asia/Ho_Chi_Minh").format("yyyyMMDDHHmmss");
      let amount = totalAmount;
      let orderInfo = `Thanh toan don hang ${trans.order} gia tri ${amount} VND`;
      let orderPayType = "other";
      let locale = language;
      if (locale === null || locale === "") {
        locale = "vn";
      }
      let currCode = "VND";
      let vnp_Params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": tmnCode,
        "vnp_Locale": locale,
        "vnp_CurrCode": currCode,
        "vnp_TxnRef": trans.id,
        "vnp_OrderInfo": orderInfo,
        "vnp_OrderType": orderPayType,
        "vnp_Amount": amount * 100,
        "vnp_ReturnUrl": merchantReturnUrl,
        "vnp_IpAddr": ipAddr,
        "vnp_CreateDate": createDate,
      };
      if (bankCode && bankCode !== null && bankCode !== "") {
        vnp_Params["vnp_BankCode"] = bankCode;
      }
      vnp_Params = sortObject(vnp_Params);
      let signData = querystring.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac("sha512", secretKey);
      vnp_Params["vnp_SecureHash"] = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });
      await VnpayTransaction.updateOne({ id: trans.id }).set({
        payUrl: vnpUrl,
        requestData: JSON.stringify(vnp_Params),
      });
      return vnpUrl;
    }
  },

  verifyInputData: (req, res) => {
    try {
      const vnp_Params = req.body;
      var secureHash = vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];
      vnp_Params = sortObject(vnp_Params);
      const secretKey = "S9U05FEO5JS9QZ7TNFHPWPJVA234YCAG";
      var signData = querystring.stringify(vnp_Params, { encode: false });
      var hmac = crypto.createHmac("sha512", secretKey);
      var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      res.json({ isValid: secureHash === signed });
    } catch (error) {
      res.status(500).send(error);
    }
  },

  refundVnp: async (req, res) => {
    try {
      const { customer, transId, amount, info, dataReq, ip } = req.body;
      var vnp_Params = {};
      var vnpUrl = "https://sandbox.vnpayment.vn/merchant_webapi/merchant.html";
      var signMethod = "MD5";
      var tmnCode = "3B82FLAC";
      var secretKey = "S9U05FEO5JS9QZ7TNFHPWPJVA234YCAG";
      var createDate = moment().format("YYYYMMDDhhmmss");
      vnp_Params["vnp_Version"] = "2.0.0";
      vnp_Params["vnp_Command"] = "refund";
      vnp_Params["vnp_TmnCode"] = tmnCode;
      vnp_Params["vnp_CreateBy"] = "Tastyfood";
      vnp_Params["vnp_TransactionType"] = "02";
      vnp_Params["vnp_TxnRef"] = transId;
      vnp_Params["vnp_Amount"] = amount * 100;
      vnp_Params["vnp_OrderInfo"] = info;
      vnp_Params["vnp_TransDate"] = dataReq && dataReq.vnp_CreateDate ? dataReq.vnp_CreateDate : createDate;
      vnp_Params["vnp_CreateDate"] = createDate;
      vnp_Params["vnp_IpAddr"] = ip;
      vnp_Params = sortObject(vnp_Params);
      var signData = secretKey + querystring.stringify(vnp_Params, { encode: false });

      var secureHash = "";
      switch (signMethod) {
        case "MD5": {
          secureHash = md5(signData);
          vnp_Params["vnp_SecureHashType"] = "MD5";
          break;
        }
        case "SHA256": {
          secureHash = sha256(signData);
          vnp_Params["vnp_SecureHashType"] = "SHA256";
          break;
        }
      }
      vnp_Params["vnp_SecureHash"] = secureHash;
      vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: true });
      let options = {
        method: "GET",
        uri: vnpUrl,
        headers: {},
      };
      let trans = {};
      try {
        let respRefundVnp = await request(options);
        if (respRefundVnp && respRefundVnp.vnp_ResponseCode === "00") {
          trans = await VnpayTransaction.updateOne({ id: transId }).set({
            status: VnpayTransactionController.STATUS.REFUND,
            payRefundStatus: respRefundVnp.vnp_TransactionStatus,
          });
        }
        res.json(trans);
      } catch (error) {
        throw new Error("Lỗi hoàn trả, vui lòng thử lại sau ít phút.");
      }
    } catch (error) {
      res.status(500).send(error);
    }
  },

  collectedTransCalculateExp: async (req, res) => {
    try {
      let nTrans = req.body.nTrans;
      let transactions = await VnpayTransaction.find({
        where: {
          status: VnpayTransactionController.STATUS.CALCULATE,
          expAt: { "<=": moment().valueOf() },
        },
        limit: nTrans,
      });
      for (var i = 0; i < transactions.length; i++) {
        //refund
      }
      res.json(transactions);
    } catch (error) {
      res.status(500).send(error);
    }
  },
};

function sortObject(obj) {
  var sorted = {};
  var str = [];
  var key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

module.exports = VnpayTransactionController;
