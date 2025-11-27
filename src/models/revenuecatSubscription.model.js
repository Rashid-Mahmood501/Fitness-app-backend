const mongoose = require("mongoose");

const revenuecatSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    revenuecatSubscriberId: {
      type: String,
      required: true,
      index: true
    },
    productId: {
      type: String,
      required: true
    },
    entitlementId: {
      type: String,
      required: true,
      default: "Pro"
    },
    platform: {
      type: String,
      enum: ["APP_STORE", "PLAY_STORE", "STRIPE", "PROMOTIONAL", "AMAZON", "MAC_APP_STORE", "RC_BILLING"],
      required: true
    },
    status: {
      type: String,
      enum: [
        "active",
        "expired",
        "cancelled",
        "billing_issue",
        "grace_period",
        "paused",
        "in_trial",
        "intro_offer"
      ],
      required: true,
      default: "active"
    },
    purchasedAt: {
      type: Date,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    willRenew: {
      type: Boolean,
      default: true
    },
    isInIntroOfferPeriod: {
      type: Boolean,
      default: false
    },
    isTrialPeriod: {
      type: Boolean,
      default: false
    },
    autoResumeDate: {
      type: Date,
      default: null
    },
    unsubscribeDetectedAt: {
      type: Date,
      default: null
    },
    billingIssuesDetectedAt: {
      type: Date,
      default: null
    },
    gracePeriodExpiresAt: {
      type: Date,
      default: null
    },
    originalTransactionId: {
      type: String,
      required: true,
      index: true
    },
    storeTransactionId: {
      type: String,
      required: true
    },
    periodType: {
      type: String,
      enum: ["NORMAL", "TRIAL", "INTRO", "PROMOTIONAL"],
      default: "NORMAL"
    },
    priceInPurchasedCurrency: {
      type: Number
    },
    currency: {
      type: String
    },
    environment: {
      type: String,
      enum: ["PRODUCTION", "SANDBOX"],
      default: "PRODUCTION"
    },
    cancelReason: {
      type: String,
      enum: ["UNSUBSCRIBE", "BILLING_ERROR", "DEVELOPER_INITIATED", "PRICE_INCREASE", "CUSTOMER_SUPPORT", "UNKNOWN"],
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for checking active subscriptions
revenuecatSubscriptionSchema.index({ user: 1, status: 1, expiresAt: -1 });

// Method to check if subscription is currently active
revenuecatSubscriptionSchema.methods.isActive = function() {
  return this.status === "active" && this.expiresAt > new Date();
};

module.exports = mongoose.model("RevenuecatSubscription", revenuecatSubscriptionSchema);
