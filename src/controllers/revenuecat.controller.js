const axios = require("axios");
require("dotenv").config();
const User = require("../models/user.model");

// RevenueCat API Configuration
const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY;
const REVENUECAT_API_URL = "https://api.revenuecat.com/v1";

// Create axios instance for RevenueCat API
const revenueCatApi = axios.create({
  baseURL: REVENUECAT_API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${REVENUECAT_API_KEY}`,
  },
});

/**
 * Get subscription status from RevenueCat
 * This endpoint verifies the user's subscription status with RevenueCat
 */
const getRevenueCatStatus = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Query RevenueCat API for subscriber info
    const response = await revenueCatApi.get(`/subscribers/${userId}`);

    const subscriber = response.data.subscriber;

    // Check if user has active entitlements
    const entitlements = subscriber.entitlements || {};
    const hasActiveSubscription = Object.keys(entitlements).some(
      (key) => entitlements[key].expires_date === null || new Date(entitlements[key].expires_date) > new Date()
    );

    res.json({
      success: true,
      isActive: hasActiveSubscription,
      entitlements: entitlements,
      subscriptions: subscriber.subscriptions || {},
    });
  } catch (error) {
    console.error("Error fetching RevenueCat status:", error.response?.data || error.message);

    // Handle 404 - User not found in RevenueCat (no subscription)
    if (error.response?.status === 404) {
      return res.json({
        success: true,
        isActive: false,
        entitlements: {},
        subscriptions: {},
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching subscription status",
      error: error.message,
    });
  }
};

/**
 * Sync RevenueCat subscriber info with local database
 * This is optional - can be used to store subscription info locally
 */
const syncRevenueCatSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const { revenueCatUserId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Update user with RevenueCat user ID
    await User.findByIdAndUpdate(userId, {
      revenueCatUserId: revenueCatUserId || userId,
    });

    res.json({
      success: true,
      message: "RevenueCat subscription synced successfully",
    });
  } catch (error) {
    console.error("Error syncing RevenueCat subscription:", error);
    res.status(500).json({
      success: false,
      message: "Error syncing subscription",
      error: error.message,
    });
  }
};

/**
 * RevenueCat Webhook Handler
 * Handles events from RevenueCat webhooks
 *
 * Important events to handle:
 * - INITIAL_PURCHASE: First time subscription purchase
 * - RENEWAL: Subscription renewed
 * - CANCELLATION: Subscription cancelled
 * - EXPIRATION: Subscription expired
 * - PRODUCT_CHANGE: User changed subscription plan
 * - NON_RENEWING_PURCHASE: One-time purchase
 * - BILLING_ISSUE: Payment failed
 */
const revenueCatWebhook = async (req, res) => {
  try {
    // Verify webhook authenticity (optional but recommended)
    const authHeader = req.headers["authorization"];
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer mySuperSecretWebhookKey_98123`) {
      console.warn("⚠️ Unauthorized webhook request");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const event = req.body;

    console.log("📩 RevenueCat Webhook Event:", {
      type: event.type,
      app_user_id: event.app_user_id,
      product_id: event.product_id,
    });

    const {
      type,
      app_user_id,
      product_id,
      purchased_at_ms,
      expiration_at_ms,
      store,
      entitlement_ids,
      price_in_purchased_currency,
      currency,
    } = event;

    // Find user by app_user_id (this should be your MongoDB user ID)
    const user = await User.findById(app_user_id).catch(() => null);

    if (!user) {
      console.warn(`⚠️ User not found for app_user_id: ${app_user_id}`);
      // Still return 200 to acknowledge receipt
      return res.status(200).json({ received: true });
    }

    // Handle different event types
    switch (type) {
      case "INITIAL_PURCHASE":
        console.log(`✅ Initial purchase for user: ${app_user_id}`);
        // Update user subscription status
        await User.findByIdAndUpdate(app_user_id, {
          hasActiveSubscription: true,
          subscriptionStartDate: new Date(purchased_at_ms),
          subscriptionExpirationDate: expiration_at_ms ? new Date(expiration_at_ms) : null,
          subscriptionProductId: product_id,
          subscriptionStore: store,
          subscriptionCancelled: false,
          revenueCatUserId: app_user_id,
        });
        console.log(`✅ User ${app_user_id} subscription activated`);
        break;

      case "RENEWAL":
        console.log(`✅ Subscription renewed for user: ${app_user_id}`);
        await User.findByIdAndUpdate(app_user_id, {
          hasActiveSubscription: true,
          subscriptionExpirationDate: expiration_at_ms ? new Date(expiration_at_ms) : null,
          lastRenewalDate: new Date(purchased_at_ms),
        });
        break;

      case "CANCELLATION":
        console.log(`⚠️ Subscription cancelled for user: ${app_user_id}`);
        // Note: User still has access until expiration date
        await User.findByIdAndUpdate(app_user_id, {
          subscriptionCancelled: true,
          subscriptionCancellationDate: new Date(),
        });
        console.log(`ℹ️ User ${app_user_id} subscription cancelled, access until ${new Date(expiration_at_ms)}`);
        break;

      case "EXPIRATION":
        console.log(`❌ Subscription expired for user: ${app_user_id}`);
        await User.findByIdAndUpdate(app_user_id, {
          hasActiveSubscription: false,
          subscriptionExpirationDate: new Date(expiration_at_ms || Date.now()),
        });
        break;

      case "PRODUCT_CHANGE":
        console.log(`🔄 Product changed for user: ${app_user_id}`);
        await User.findByIdAndUpdate(app_user_id, {
          subscriptionProductId: product_id,
          subscriptionExpirationDate: expiration_at_ms ? new Date(expiration_at_ms) : null,
        });
        break;

      case "UNCANCELLATION":
        console.log(`✅ Subscription reactivated for user: ${app_user_id}`);
        await User.findByIdAndUpdate(app_user_id, {
          subscriptionCancelled: false,
          hasActiveSubscription: true,
        });
        break;

      case "NON_RENEWING_PURCHASE":
        console.log(`💰 One-time purchase for user: ${app_user_id}`);
        // Handle one-time purchases if needed
        break;

      case "BILLING_ISSUE":
        console.log(`⚠️ Billing issue for user: ${app_user_id}`);
        // Optionally notify user of payment failure
        await User.findByIdAndUpdate(app_user_id, {
          hasActiveSubscription: false,
        });
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${type}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    // Still return 200 to prevent RevenueCat from retrying
    res.status(200).json({ received: true, error: error.message });
  }
};

module.exports = {
  getRevenueCatStatus,
  syncRevenueCatSubscription,
  revenueCatWebhook,
};
