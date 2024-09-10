const db_helpers = require("../helpers/db_helpers");

module.exports.updateRateBook = (bookId, callback) => {
  const updateRateBookQuery = `
      UPDATE books
      SET rate_book = (
        SELECT COALESCE(AVG(rating), 5) -- Tính trung bình rating, gán 5 nếu không có review
        FROM reviews
        WHERE book_id = ?
      )
      WHERE book_id = ?;
    `;

  // Thực hiện câu lệnh query
  db_helpers.query(updateRateBookQuery, [bookId, bookId], (error, result) => {
    if (error) {
      console.error("Error updating rate_book:", error);
    }
  });
};
