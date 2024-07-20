function checkSex(sex) {
  // kiểm tra sex có phải là số không
  if (typeof sex !== "number") {
    return false;
  }

  // kiểm tra sex có phải là 0 hoặc 1 không
  if (sex !== 0 && sex !== 1) {
    return false;
  }

  return true;
}

module.exports = { checkSex };
