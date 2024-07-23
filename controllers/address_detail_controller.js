const helpers = require("../helpers/helpers");
const AddressDetail = require("../models/address_detail_model");
const Book = require("../models/book_model");
const CartDetail = require("../models/cart_detail_model");
const User = require("../models/user_model");
const { regexPhone } = require("../Service/regex");
const msg_success = "successfully";
const msg_fail = "fail";

module.exports.controller = (app, io, socket_list) => {
    app.post("/api/address_detail/add", helpers.authorization, (req, res) => {
        const reqObj = req.body;
        helpers.CheckParameterValid(
            res,
            reqObj,
            ["name", "phone", "address", "address_type", "is_default"],
            async () => {
                helpers.CheckParameterNull(
                    res,
                    reqObj,
                    ["name", "phone", "address", "address_type", "is_default"],
                    async () => {
                        const { name, phone, address, address_type } = reqObj;
                        const user_id = req.auth.user_id;

                        const isPhone = regexPhone(phone);

                        if (!isPhone) {
                            return res.json({
                                status: "0",
                                message: "Phone is invalid",
                            });
                        }

                        if (typeof req.body.is_default !== "boolean") {
                            return res.json({
                                status: "0",
                                message: "is_default is invalid",
                            });
                        }

                        const data = {
                            user_id,
                            name,
                            phone,
                            address,
                            address_type,
                        };
                        const address_detail = await AddressDetail.create(data);

                        if (req.body.is_default) {
                            await User.update(
                                { default_address: address_detail.address_id },
                                { where: { user_id } }
                            );
                        }

                        if (address_detail) {
                            return res.json({
                                status: "1",
                                message: msg_success,
                                data: address_detail,
                            });
                        }
                    }
                );
            }
        );
    });

    app.post("/api/address_detail/update", helpers.authorization, (req, res) => {
        const reqObj = req.body;
        helpers.CheckParameterValid(
            res,
            reqObj,
            ["id", "name", "phone", "address", "address_type", "is_default"],
            async () => {
                helpers.CheckParameterNull(
                    res,
                    reqObj,
                    ["id", "name", "phone", "address", "address_type", "is_default"],
                    async () => {
                        const { id, name, phone, address, address_type } = reqObj;
                        const user_id = req.auth.user_id;
                        const address_detail = await AddressDetail.findOne({
                            where: { address_id: id, user_id },
                        });
                        if (!address_detail) {
                            return res.json({
                                status: "0",
                                message: "Address not found",
                            });
                        }

                        if (typeof req.body.is_default !== "boolean") {
                            return res.json({
                                status: "0",
                                message: "is_default is invalid",
                            });
                        }

                        const isPhone = regexPhone(phone);

                        if (!isPhone) {
                            return res.json({
                                status: "0",
                                message: "Phone is invalid",
                            });
                        }
                        address_detail.name = name;
                        address_detail.phone = phone;
                        address_detail.address = address;
                        address_detail.address_type = address_type;
                        await address_detail.save();

                        if (req.body.is_default) {
                            await User.update(
                                {
                                    default_address: address_detail.address_id,
                                    updated_at: new Date(),
                                },
                                { where: { user_id } }
                            );
                        }
                        return res.json({
                            status: "1",
                            message: msg_success,
                            data: address_detail,
                        });
                    }
                );
            }
        );
    });

    app.post("/api/address_detail/delete", helpers.authorization, (req, res) => {
        const reqObj = req.body;
        helpers.CheckParameterValid(res, reqObj, ["id"], async () => {
            const { id } = reqObj;
            const user_id = req.auth.user_id;
            const address_detail = await AddressDetail.findOne({
                where: { address_id: id, user_id },
            });
            if (!address_detail) {
                return res.json({
                    status: "0",
                    message: "Address not found",
                });
            }
            await address_detail.destroy();
            return res.json({
                status: "1",
                message: msg_success,
            });
        });
    });

    app.post("/api/address_detail/get", helpers.authorization, (req, res) => {
        const reqObj = req.body;
        helpers.CheckParameterValid(res, reqObj, [], async () => {
            const user_id = req.auth.user_id;
            const addressDetails = await AddressDetail.findAll({
                where: { user_id },
                order: [["created_at", "DESC"]],
            });

            const user = await User.findOne({ where: { user_id } });
            const default_address = user.default_address;
            addressDetails.sort((a, b) => {
                if (a.address_id === default_address) return -1;
                if (b.address_id === default_address) return 1;
                return 0;
            });

            const data = addressDetails.map((address) => {
                return {
                    ...address.dataValues,
                    is_default: address.address_id === default_address,
                };
            });

            return res.json({
                status: "1",
                message: msg_success,
                data: data,
            });
        });
    });
};
