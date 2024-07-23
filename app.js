const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const fs = require("fs");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

require("dotenv").config();

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const orderRouter = require("./routes/orderRoutes");
const VnpayTransactionRoutes = require("./routes/VnpayTransactionRoutes");
const PaymentRoutes = require("./routes/PaymentRoutes");

const serverPort = process.env.PORT || 3002;
const BASE_URL = process.env.BASE_URL;

const app = express();
app.use(bodyParser.json());

const server = require("http").createServer(app);
var io = require("socket.io")(server, {
  cors: {
    origin: BASE_URL,
    methods: ["GET", "POST"],
  },
});

const serviceAccount = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
};

var user_socket_connect_list = [];

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/users", usersRouter);
app.use("/orders", orderRouter);
app.use("/vnpayTransaction", VnpayTransactionRoutes);
app.use("/payment", PaymentRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const corsOptions = {
  origin: BASE_URL,
};

app.use(cors(corsOptions));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

fs.readdirSync("./controllers").forEach((file) => {
  if (file.slice(-3) === ".js") {
    const route = require("./controllers/" + file);
    if (typeof route.controller === "function") {
      route.controller(app, io, user_socket_connect_list);
    }
  }
});

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

const db = require("./models");
db.sequelize
  .sync({ alter: true })
  .then(() => {
    server.listen(serverPort, () => {
      console.log("Server Start : " + serverPort);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = app;

Array.prototype.swap = function (x, y) {
  const b = this[x];
  this[x] = this[y];
  this[y] = b;
  return this;
};

Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item);
};

Array.prototype.replace_null = function (replace = '""') {
  return JSON.parse(JSON.stringify(this).replace(/null/g, replace));
};

String.prototype.replaceAll = function (search, replacement) {
  const target = this;
  return target.replace(new RegExp(search, "g"), replacement);
};