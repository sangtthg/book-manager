const { format } = require("date-fns-tz");

const dateNow = format(new Date(), "yyyy-MM-dd HH:mm:ss", {
  timeZone: "Asia/Ho_Chi_Minh",
});

module.exports = {
  dateNow,
};
