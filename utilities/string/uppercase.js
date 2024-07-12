// viết 1 hàm viết hoa chữ cái đầu của 1 chuỗi
function uppercase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
module.exports = { uppercase };
