/**
 * RevenueCat API Service
 *
 * Provides direct API calls to RevenueCat for real-time subscription verification.
 * This is used to handle race conditions where webhook hasn't synced yet.
 */

require("dotenv").config();
const RevenuecatSubscription = require("../models/revenuecatSubscription.model");
const User = require("../models/user.model");

const REVENUECAT_API_BASE = "https://api.revenuecat.com/v1";
const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY;

/**
 * Fetch subscriber data directly from RevenueCat API
 * @param {string} appUserId - The RevenueCat app_user_id (usually MongoDB user _id)
 * @returns {Promise<Object|null>} Subscriber data or null if not found
 */
async function fetchSubscriberFromRevenueCat(appUserId) {
  if (!REVENUECAT_API_KEY) {
    console.error("❌ REVENUECAT_API_KEY not configured");
    return null;
  }

  try {
    console.log(`🔍 [RevenueCat API] Fetching subscriber: ${appUserId}`);

    const response = await fetch(`${REVENUECAT_API_BASE}/subscribers/${appUserId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${REVENUECAT_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️ [RevenueCat API] Subscriber not found: ${appUserId}`);
        return null;
      }
      console.error(`❌ [RevenueCat API] Error response: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ [RevenueCat API] Subscriber data retrieved for: ${appUserId}`);
    return data.subscriber;
  } catch (error) {
    console.error(`❌ [RevenueCat API] Request failed:`, error.message);
    return null;
  }
}

/**
 * Check if subscriber has an active entitlement
 * @param {Object} subscriber - RevenueCat subscriber object
 * @param {string} entitlementId - The entitlement ID to check (default: "Pro")
 * @returns {Object|null} Active entitlement info or null
 */
function getActiveEntitlement(subscriber, entitlementId = "Pro") {
  if (!subscriber || !subscriber.entitlements) {
    return null;
  }

  const entitlement = subscriber.entitlements[entitlementId];

  if (!entitlement) {
    // Check all entitlements if specific one not found
    for (const [key, ent] of Object.entries(subscriber.entitlements)) {
      if (ent.expires_date) {
        const expiresAt = new Date(ent.expires_date);
        if (expiresAt > new Date()) {
          console.log(`✅ [RevenueCat API] Found active entitlement: ${key}`);
          return { entitlementId: key, ...ent };
        }
      }
    }
    return null;
  }

  // Check if this specific entitlement is active
  if (entitlement.expires_date) {
    const expiresAt = new Date(entitlement.expires_date);
    if (expiresAt > new Date()) {
      console.log(`✅ [RevenueCat API] Active entitlement found: ${entitlementId}`);
      return { entitlementId, ...entitlement };
    }
  }

  return null;
}

/**
 * Verify user's subscription status directly from RevenueCat API
 * and sync to database if active subscription found
 *
 * @param {string} userId - MongoDB user ID
 * @returns {Promise<{hasActiveSubscription: boolean, subscription?: Object, source: string}>}
 */
async function verifyAndSyncSubscription(userId) {
  console.log(`🔄 [RevenueCat Sync] Starting real-time verification for user: ${userId}`);

  // Get user to find their RevenueCat app_user_id
  const user = await User.findById(userId);

  if (!user) {
    console.error(`❌ [RevenueCat Sync] User not found: ${userId}`);
    return { hasActiveSubscription: false, source: "user_not_found" };
  }

  // Determine the app_user_id to use
  // RevenueCat typically uses the MongoDB _id as app_user_id
  const appUserIds = [
    user.revenuecatAppUserId,
    userId.toString(),
    `$RCAnonymousID:${userId}`
  ].filter(Boolean);

  console.log(`🔍 [RevenueCat Sync] Checking app_user_ids:`, appUserIds);

  for (const appUserId of appUserIds) {
    const subscriber = await fetchSubscriberFromRevenueCat(appUserId);

    if (!subscriber) {
      continue;
    }

    // Check for active entitlement
    const entitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || "Pro";
    const activeEntitlement = getActiveEntitlement(subscriber, entitlementId);

    if (activeEntitlement) {
      console.log(`✅ [RevenueCat Sync] Active subscription found via API!`);
      console.log(`   Product: ${activeEntitlement.product_identifier}`);
      console.log(`   Expires: ${activeEntitlement.expires_date}`);

      // Sync to database
      const subscription = await syncSubscriptionToDatabase(user, appUserId, subscriber, activeEntitlement);

      return {
        hasActiveSubscription: true,
        subscription,
        source: "revenuecat_api"
      };
    }
  }

  console.log(`⚠️ [RevenueCat Sync] No active subscription found via API for user: ${userId}`);
  return { hasActiveSubscription: false, source: "revenuecat_api_no_subscription" };
}

/**
 * Sync subscription data from RevenueCat API to local database
 */
async function syncSubscriptionToDatabase(user, appUserId, subscriber, activeEntitlement) {
  console.log(`💾 [RevenueCat Sync] Syncing subscription to database...`);

  // Update user's revenuecatAppUserId if not set
  if (!user.revenuecatAppUserId && appUserId !== user._id.toString()) {
    user.revenuecatAppUserId = appUserId;
    await user.save();
    console.log(`✅ [RevenueCat Sync] Updated user's revenuecatAppUserId: ${appUserId}`);
  }

  // Determine platform from store
  const platformMap = {
    "app_store": "APP_STORE",
    "play_store": "PLAY_STORE",
    "stripe": "STRIPE",
    "promotional": "PROMOTIONAL",
    "amazon": "AMAZON",
    "mac_app_store": "MAC_APP_STORE",
    "rc_billing": "RC_BILLING"
  };

  const store = activeEntitlement.store || "APP_STORE";
  const platform = platformMap[store.toLowerCase()] || "APP_STORE";

  const subscriptionData = {
    user: user._id,
    revenuecatSubscriberId: appUserId,
    productId: activeEntitlement.product_identifier,
    entitlementId: activeEntitlement.entitlementId || "Pro",
    platform,
    status: "active",
    purchasedAt: new Date(activeEntitlement.purchase_date || Date.now()),
    expiresAt: new Date(activeEntitlement.expires_date),
    willRenew: activeEntitlement.will_renew !== false,
    isTrialPeriod: activeEntitlement.period_type === "trial",
    originalTransactionId: activeEntitlement.original_purchase_date
      ? `sync_${new Date(activeEntitlement.original_purchase_date).getTime()}_${user._id}`
      : `sync_${Date.now()}_${user._id}`,
    storeTransactionId: `api_sync_${Date.now()}`,
    periodType: activeEntitlement.period_type === "trial" ? "TRIAL" : "NORMAL",
    environment: subscriber.request_date ? "PRODUCTION" : "SANDBOX"
  };

  // Upsert subscription
  const subscription = await RevenuecatSubscription.findOneAndUpdate(
    {
      user: user._id,
      productId: subscriptionData.productId
    },
    {
      $set: subscriptionData,
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true, new: true }
  );

  console.log(`✅ [RevenueCat Sync] Subscription synced to database: ${subscription._id}`);
  console.log(`   Status: ${subscription.status}`);
  console.log(`   Expires: ${subscription.expiresAt}`);

  return subscription;
}

module.exports = {
  fetchSubscriberFromRevenueCat,
  getActiveEntitlement,
  verifyAndSyncSubscription
};
