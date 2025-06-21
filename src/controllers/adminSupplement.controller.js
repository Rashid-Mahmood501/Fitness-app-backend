const Supplement = require("../models/supplement.model");

const createSupplement = async (req, res) => {
  try {
    const { name, description } = req.body;
    const supplement = await Supplement.create({
      name,
      description,
    });
    res.json({
      success: true,
      data: supplement,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
  }
};

const getAllSupplements = async (req, res) => {
  try {
    const supplements = await Supplement.find();
    res.json({
      success: true,
      data: supplements,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
  }
};
const updateSupplement = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description } = req.body;

    const updatedSupplement = await Supplement.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updatedSupplement) {
      return res.status(404).json({
        success: false,
        error: "Supplement not found",
      });
    }

    res.json({
      success: true,
      data: updatedSupplement,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
  }
};
const deleteSupplement = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedSupplement = await Supplement.findByIdAndDelete(id);

    if (!deletedSupplement) {
      return res.status(404).json({
        success: false,
        error: "Supplement not found",
      });
    }

    res.json({
      success: true,
      message: "Supplement deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
  }
};

module.exports = {
  createSupplement,
  getAllSupplements,
  updateSupplement,
  deleteSupplement,
};
