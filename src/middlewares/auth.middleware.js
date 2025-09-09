const jwt = require("jsonwebtoken");
require("dotenv").config();
const Subscription = require("../models/subscription.model");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided", logout: true });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    const subscription = await Subscription.findOne({ user: req.userId });
    if (
      !subscription ||
      !["active", "trialing"].includes(subscription.status)
    ) {
      return res.status(403).json({
        success: false,
        redirectToSubscription: true,
        message: "Subscription required",
      });
    }
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token", logout: true });
  }
};

module.exports = authMiddleware;
