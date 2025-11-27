const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "INITIAL_PURCHASE",
        "RENEWAL",
        "CANCELLATION",
        "UNCANCELLATION",
        "NON_RENEWING_PURCHASE",
        "EXPIRATION",
        "BILLING_ISSUE",
        "PRODUCT_CHANGE",
        "TRANSFER",
        "SUBSCRIPTION_PAUSED",
        "SUBSCRIPTION_EXTENDED",
        "TEST"
      ],
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
    eventTimestamp: {
      type: Date,
      required: true,
      index: true
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    processed: {
      type: Boolean,
      default: false,
      index: true
    },
    processingError: {
      type: String,
      default: null
    },
    retryCount: {
      type: Number,
      default: 0
    },
    environment: {
      type: String,
      enum: ["PRODUCTION", "SANDBOX"],
      default: "PRODUCTION"
    }
  },
  {
    timestamps: true
  }
);

// Compound index for finding events for a specific subscriber
webhookEventSchema.index({ revenuecatSubscriberId: 1, eventTimestamp: -1 });

// Compound index for finding unprocessed events
webhookEventSchema.index({ processed: 1, createdAt: 1 });

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
