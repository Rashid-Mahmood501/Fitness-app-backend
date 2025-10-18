const express = require("express");
const router = express.Router();
const {
  signin,
  signup,
  forgotPassword,
  resetPassword,
  verifyOTP,
} = require("../controllers/auth.controller");
const {
  signinValidation,
  signupValidation,
} = require("../validations/auth.validation");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    next();
  };
};

router.post("/signup", validateRequest(signupValidation), signup);
router.post("/signin", validateRequest(signinValidation), signin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
