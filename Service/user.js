const db_helpers = require("../helpers/db_helpers");

// viết 1 hàm selectQuery trong file user.js để lấy thông tin user từ database
module.exports.selectUser = async (uid) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM users WHERE user_id = '${uid}'`;
    db_helpers.query(query, (err, result) => {
      if (err) {
        reject(null);
      }
      if (result.length === 0) reject(null);
      resolve(result[0]);
    });
  });
};
