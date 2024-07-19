const { regexEmail } = require("../Service/regex");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const db = require("../helpers/db_helpers");

const generateRandomOTP = async () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const saveOTPToDB = async (email, otp) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO otps (email, otp) VALUES ('${email}', '${otp}')`;
    db.query(query, (err, result) => {
      if (err) {
        reject(new Error(`Lỗi khi lưu OTP vào DB: ${err}`));
      }
      const selectQuery = `SELECT * FROM otps WHERE id = ${result.insertId}`;
      db.query(selectQuery, (selectErr, selectResult) => {
        if (selectErr) {
          reject(new Error(`Lỗi khi lấy OTP từ DB: ${selectErr}`));
        }
        resolve(selectResult);
      });
    });
  });
};

class EmailHelper {
  static sendMail = async (email, title, content) => {
    if (!regexEmail(email)) throw new Error("Email không đúng định dạng");
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_SEND_EMAIL,
        pass: process.env.PASS_SEND_EMAIL,
      },
    });
    let mailOptions = {
      from: process.env.USER_SEND_EMAIL,
      to: email,
      subject: title,
      text: content,
    };
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
        throw new Error(`Lỗi khi gửi mã xác nhận Email: ${error}`);
      }
    });
  };

  static async sendOTPEmail(email) {
    if (!regexEmail(email)) throw new Error("Email không đúng định dạng");
    const otp = await generateRandomOTP();
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_SEND_EMAIL,
        pass: process.env.PASS_SEND_EMAIL,
      },
    });
    let mailOptions = {
      from: process.env.USER_SEND_EMAIL,
      to: email,
      subject: "Email Xác Minh",
      text: `Mã xác minh của bạn là: ${otp}.`,
    };
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
        throw new Error(`Lỗi khi gửi mã xác nhận Email: ${error}`);
      }
    });
    const db_otp = await saveOTPToDB(email, otp);
    console.log("db_otp", db_otp);
    return db_otp;
  }

  static async verifyOTP(id, email, otp) {
    const query = `SELECT * FROM otps WHERE id = '${id}' AND email = '${email}' AND otp = '${otp}' AND created_at > NOW() - INTERVAL 5 MINUTE`;
    return new Promise((resolve, reject) =>
      db.query(query, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res.length > 0);
      })
    );
  }
}
module.exports = EmailHelper;
