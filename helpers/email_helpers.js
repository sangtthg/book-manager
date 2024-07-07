const { regexEmail } = require("../Service/regex");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const db = require("../helpers/db_helpers");

const generateRandomOTP = async () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const saveOTPToDB = async (email, otp) => {
  const query = `INSERT INTO otps (email, otp) VALUES ('${email}', '${otp}')`;
  return new Promise((resolve, reject) =>
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    })
  );
};

class EmailHelper {
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
    await saveOTPToDB(email, otp);
    return true;
  }

  static async verifyOTP(id, email, otp) {
    const query = `SELECT * FROM otps WHERE id = '${id}' AND email = '${email}' AND otp = '${otp}' AND created_at > NOW() - INTERVAL 10 MINUTE`;
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
