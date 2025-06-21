const express = require("express");
const {
  createSupplement,
  getAllSupplements,
  updateSupplement,
  deleteSupplement,
} = require("../controllers/adminSupplement.controller");

const router = express.Router();

router.post("/create", createSupplement);
router.get("/all", getAllSupplements);
router.put("/update/:id", updateSupplement);
router.delete("/delete/:id", deleteSupplement);

module.exports = router;
