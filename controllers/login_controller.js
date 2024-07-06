const db = require("./../helpers/db_helpers");
const helper = require("./../helpers/helpers");
const multiparty = require("multiparty"); //npm i multiparty
const fs = require("fs");
const imageSavePath = "./public/img/";

module.exports.controller = (app, io, socket_list) => {
  const msg_success = "successfully";
  const msg_fail = "fail";
  const msg_invalidUser = "invalid username and password";

  app.post("/api/login", (req, res) => {
    helper.Dlog(req.body);
    var reqObj = req.body;

    helper.CheckParameterValid(res, reqObj, ["email", "password"], () => {
      db.query(
        'SELECT `user_id`, `email`, `created_date`, `user_status` FROM `users` WHERE `email` = ? AND  `password` = ? AND `user_status` = "1" ',
        [reqObj.email, reqObj.password],
        (err, result) => {
          if (err) {
            helper.ThrowHtmlError(err, res);
            return;
          }

          if (result.length > 0) {
            res.json({ status: "1", payload: result[0], message: msg_success });
          } else {
            res.json({ status: "0", message: msg_invalidUser });
          }
        }
      );
    });
  });

  app.post("/api/upload_image", (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, (err, reqObj, files) => {
      if (err) {
        helper.ThrowHtmlError(err, res);
        return;
      }

      helper.Dlog("--------------- Parameter --------------");
      helper.Dlog(reqObj);

      helper.Dlog("--------------- Files --------------");
      helper.Dlog(files);

      if (files.image !== undefined) {
        const extension = files.image[0].originalFilename.substring(
          files.image[0].originalFilename.lastIndexOf(".") + 1
        );
        const imageFileName = helper.fileNameGenerate(extension);

        const newPath = imageSavePath + imageFileName;

        fs.rename(files.image[0].path, newPath, (err) => {
          if (err) {
            helper.ThrowHtmlError(err);
            return;
          } else {
            const name = reqObj.name;
            const address = reqObj.address;

            helper.Dlog(name);
            helper.Dlog(address);

            res.json({
              status: "1",
              payload: {
                name: name,
                address: address,
                image: helper.ImagePath() + imageFileName,
              },
              message: msg_success,
            });
          }
        });
      }
    });
  });

  app.post("/api/upload_multi_image", (req, res) => {
    var form = new multiparty.Form();
    form.parse(req, (err, reqObj, files) => {
      if (err) {
        helper.ThrowHtmlError(err, res);
        return;
      }

      helper.Dlog("--------------- Parameter --------------");
      helper.Dlog(reqObj);

      helper.Dlog("--------------- Files --------------");
      helper.Dlog(files);

      if (files.image !== undefined) {
        var imageNamePathArr = [];
        var fullImageNamePathArr = [];
        files.image.forEach((imageFile) => {
          const extension = imageFile.originalFilename.substring(
            imageFile.originalFilename.lastIndexOf(".") + 1
          );
          const imageFileName = helper.fileNameGenerate(extension);

          imageNamePathArr.push(imageFileName);
          fullImageNamePathArr.push(helper.ImagePath() + imageFileName);
          saveImage(imageFile, imageSavePath + imageFileName);
        });

        helper.Dlog(imageNamePathArr);
        helper.Dlog(fullImageNamePathArr);

        const name = reqObj.name;
        const address = reqObj.address;

        helper.Dlog(name);
        helper.Dlog(address);

        res.json({
          status: "1",
          payload: {
            name: name,
            address: address,
            image: fullImageNamePathArr,
          },
          message: msg_success,
        });
      }
    });
  });
};

function saveImage(imageFile, savePath) {
  fs.rename(imageFile.path, savePath, (err) => {
    if (err) {
      helper.ThrowHtmlError(err);
      return;
    }
  });
}
