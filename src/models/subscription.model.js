const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeCustomerId: { type: String, required: true, index: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    priceId: { type: String, required: true },

    status: {
      type: String,
      enum: [
        "trialing",
        "active",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
      required: true,
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAt: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    endedAt: Date,

    defaultPaymentMethod: String,
    latestInvoiceId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
