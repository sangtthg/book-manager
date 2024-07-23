const bcrypt = require("bcryptjs");

const saltRounds = 10;
class Bcrypt {
  static async hashPassword(password) {
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hash(`${password}`, salt);
  }
  static async comparePassword(password, hash) {
    return bcrypt.compare(`${password}`, hash);
  }
}

module.exports = Bcrypt;
