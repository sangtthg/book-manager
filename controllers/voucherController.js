const { Op } = require("sequelize");
const Voucher = require("../models/voucher");
const moment = require("moment"); // Import thư viện moment

exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll();

    const formattedVouchers = vouchers.map((voucher) => {
      return {
        ...voucher.dataValues,
        validFrom: moment(voucher.validFrom).format("DD/MM/YYYY HH:mm"),
        validTo: moment(voucher.validTo).format("DD/MM/YYYY HH:mm"),
        createdAt: moment(voucher.createdAt).format("DD/MM/YYYY HH:mm"),
        updatedAt: moment(voucher.updatedAt).format("DD/MM/YYYY HH:mm"),
      };
    });

    res.render("vouchers", { vouchers: formattedVouchers });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) {
      return res.status(404).send("Voucher not found");
    }
    res.render("admin/voucherDetail", { voucher });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const {
      code,
      description,
      quantity,
      validFrom,
      validTo,
      status,
      discountAmount,
    } = req.body;
    const voucher = await Voucher.create({
      code,
      description,
      quantity,
      validFrom,
      validTo,
      status,
      discountAmount,
      isExpired: new Date(validTo) < new Date(),
    });
    res.redirect("/admin/vouchers");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const {
      code,
      description,
      quantity,
      validFrom,
      validTo,
      status,
      discountAmount,
    } = req.body;
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) {
      return res.status(404).send("Voucher not found");
    }
    await voucher.update({
      code,
      description,
      quantity,
      validFrom,
      validTo,
      status,
      discountAmount,
      isExpired: new Date(validTo) < new Date(),
    });
    res.redirect("/admin/vouchers");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) {
      return res.status(404).send("Voucher not found");
    }
    await voucher.destroy();
    res.redirect("/admin/vouchers");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
exports.searchVouchers = async (req, res) => {
  try {
    const { search } = req.query;
    const vouchers = await Voucher.findAll({
      where: {
        [Op.or]: [
          { code: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
      },
    });
    res.render("vouchers", { vouchers });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
exports.editVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) {
      return res.status(404).send("Voucher not found");
    }
    res.render("editVoucher", { voucher });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.getAllVouchersJson = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll();
    res.json(vouchers);
  } catch (error) {
    res.status(500).send(error.message);
  }
};
