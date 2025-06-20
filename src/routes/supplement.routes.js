const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getSupplements, createSupplement } = require("../controllers/supplement.controller");
const router = express.Router();

router.get("/get", authMiddleware, getSupplements);
router.post("/create", authMiddleware, createSupplement);

module.exports = router; 