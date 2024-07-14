const moment = require("moment-timezone");
const fs = require("fs");
const { format } = require("path");
const jwt = require("../Service/jwt");
const app_debug_mode = true;
const timezone_name = "Asia/Ho_Chi_Minh";
const msg_server_internal_error = "Server Internal Error";

module.exports = {
  ImagePath: () => {
    return "http://localhost:3002/img/";
  },

  ThrowHtmlError: (err, res) => {
    Dlog(
      "---------------------------- App is Helpers Throw Crash(" +
        serverYYYYMMDDHHmmss() +
        ") -------------------------"
    );
    Dlog(err.stack);

    fs.appendFile(
      "./crash_log/Crash" + serverDateTime("YYYY-MM-DD HH mm ss ms") + ".txt",
      err.stack,
      (err) => {
        if (err) {
          Dlog(err);
        }
      }
    );

    if (res) {
      res.json({ status: "0", message: msg_server_internal_error });
    }
  },

  ThrowSocketError: (err, client, eventName) => {
    Dlog(
      "---------------------------- App is Helpers Throw Crash(" +
        serverYYYYMMDDHHmmss() +
        ") -------------------------"
    );
    Dlog(err.stack);

    fs.appendFile(
      "./crash_log/Crash" + serverDateTime("YYYY-MM-DD HH mm ss ms") + ".txt",
      err.stack,
      (err) => {
        if (err) {
          Dlog(err);
        }
      }
    );

    if (client) {
      client.emit(eventName, {
        status: "0",
        message: msg_server_internal_error,
      });
      return;
    }
  },

  CheckParameterValid: (res, jsonObj, checkKeys = [], callback) => {
    let isValid = true;
    let missingParameter = "";

    const checkNestedKeys = (obj, keyPath) => {
      let currentObject = obj;
      for (let i = 0; i < keyPath.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(currentObject, keyPath[i])) {
          return false;
        }
        currentObject = currentObject[keyPath[i]];
      }
      return true;
    };

    checkKeys.forEach((key) => {
      const keyPath = key.split(".");
      if (!checkNestedKeys(jsonObj, keyPath)) {
        isValid = false;
        missingParameter += key + " ";
      }
    });

    if (isValid) return callback();

    if (!app_debug_mode) {
      missingParameter = "";
    }
    res.json({
      status: "0",
      message: "Missing parameter (" + missingParameter + ")",
    });
  },

  CheckParameterValidSocket: (
    client,
    eventName,
    jsonObj,
    checkKeys,
    callback
  ) => {
    let isValid = true;
    let missingParameter = "";

    checkKeys.forEach((key, indexOf) => {
      if (!Object.prototype.hasOwnProperty.call(jsonObj, key)) {
        isValid = false;
        missingParameter += key + " ";
      }
    });

    if (!isValid) {
      if (!app_debug_mode) {
        missingParameter = "";
      }
      client.emit(eventName, {
        status: "0",
        message: "Missing parameter (" + missingParameter + ")",
      });
    } else {
      return callback();
    }
  },

  createRequestToken: () => {
    const chars =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 20; i > 0; i--) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
  },

  fileNameGenerate: (extension) => {
    const chars =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 10; i > 0; i--) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return serverDateTime("YYYYMMDDHHmmssms") + result + "." + extension;
  },

  Dlog: (log) => {
    return Dlog(log);
  },

  serverDateTime: (format) => {
    return serverDateTime(format);
  },

  serverYYYYMMDDHHmmss: () => {
    return serverYYYYMMDDHHmmss();
  },

  authorization: (req, res, next) => {
    if (!req.headers.authorization) {
      return res.json({ status: "0", message: "Invalid token" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const auth = jwt.verify(token);
    if (!auth || !auth.user_id) {
      return res.json({ status: "0", message: "Invalid token" });
    }
    // const exp = auth.created_at;
    // const now = Date.now();
    // if (now - exp > 1000 * 60 * 60 * 24) {
    //   return res.json({ status: "0", message: "Token expired" });
    // }
    req.auth = auth;
    next();
  },
};

function serverDateTime(format) {
  const jun = moment(new Date());
  jun.tz(timezone_name).format();
  return jun.format(format);
}

function Dlog(log) {
  if (app_debug_mode) {
    console.log(log);
  }
}

function serverYYYYMMDDHHmmss() {
  return serverDateTime("YYYY-MM-DD HH:mm:ss");
}

process.on("uncaughtException", (err) => {});
