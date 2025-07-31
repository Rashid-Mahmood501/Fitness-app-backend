const Supplement = require("../models/supplement.model");

const getSupplements = async (req, res) => {
  try {
    const Supplements = await Supplement.find();

    res.json({
      success: true,
      data: Supplements,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
  }
};

module.exports = { getSupplements }; 