const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getSupplements } = require("../controllers/supplement.controller");
const router = express.Router();

router.get("/get", authMiddleware, getSupplements);

module.exports = router; 