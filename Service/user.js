const db_helpers = require("../helpers/db_helpers");

// viết 1 hàm selectQuery trong file user.js để lấy thông tin user từ database
module.exports.selectUser = async (uid, selects = []) => {
  return new Promise((resolve, reject) => {
    if (selects.length == 0) {
      selects = ["*"];
    } else {
      selects = selects.join(",");
    }
    const query = `SELECT ${selects} FROM users WHERE user_id = '${uid}'`;
    db_helpers.db.query(query, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result[0]);
    });
  });
};
