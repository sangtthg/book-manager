const bcrypt = require("bcrypt");
class Bcrypt {
  static async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }
  static async comparePassword(password, hash) {
    return bcrypt.compare(`${password}`, hash);
  }
}

module.exports = Bcrypt;
