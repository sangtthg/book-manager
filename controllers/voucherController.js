const { Op } = require("sequelize");
const Voucher = require("../models/voucher");

exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll();
    res.render("vouchers", { vouchers });
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