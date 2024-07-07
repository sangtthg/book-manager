class JsonWebToken {
  constructor() {
    this.jwt = require("jsonwebtoken");
    this.secret = process.env.JWT_KEY || "";
  }

  sign(payload) {
    return this.jwt.sign(payload, this.secret);
  }

  verify(token) {
    return this.jwt.verify(token, this.secret);
  }
}

module.exports = new JsonWebToken();
