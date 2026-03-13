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

/**
 * Find user by RevenueCat app_user_id, checking aliases if needed
 * This handles the case where webhook sends anonymous ID but user has MongoDB _id as alias
 *
 * @param {string} appUserId - The app_user_id from RevenueCat webhook
 * @returns {Promise<{user: Object|null, resolvedAppUserId: string|null}>}
 */
async function findUserByRevenueCatId(appUserId) {
  console.log(`🔍 [RevenueCat] Finding user for app_user_id: ${appUserId}`);

  // First, try direct lookup
  let user = await User.findOne({ revenuecatAppUserId: appUserId });
  if (user) {
    console.log(`✅ [RevenueCat] Found user by revenuecatAppUserId: ${user._id}`);
    return { user, resolvedAppUserId: appUserId };
  }

  // Try matching by MongoDB _id (in case app_user_id IS the MongoDB _id)
  if (appUserId.match(/^[0-9a-fA-F]{24}$/)) {
    user = await User.findById(appUserId);
    if (user) {
      console.log(`✅ [RevenueCat] Found user by MongoDB _id: ${user._id}`);
      return { user, resolvedAppUserId: appUserId };
    }
  }

  // If not found and it's an anonymous ID, query RevenueCat API for aliases
  if (appUserId.startsWith('$RCAnonymousID:')) {
    console.log(`🔍 [RevenueCat] Anonymous ID detected, fetching aliases from API...`);

    const subscriber = await fetchSubscriberFromRevenueCat(appUserId);
    if (subscriber && subscriber.subscriber_attributes) {
      // RevenueCat doesn't return aliases directly in subscriber response
      // But we can check if there's a non-anonymous ID that matches a user
    }

    // Try to find the subscriber data and check for known aliases
    if (subscriber) {
      // The subscriber object contains original_app_user_id and other IDs
      // Try to find user by checking all possible IDs
      const possibleIds = new Set();

      // Check if there's a $userId attribute
      if (subscriber.subscriber_attributes?.$userId?.value) {
        possibleIds.add(subscriber.subscriber_attributes.$userId.value);
      }

      // Check if there's an $email attribute we can match
      if (subscriber.subscriber_attributes?.$email?.value) {
        const userByEmail = await User.findOne({
          email: subscriber.subscriber_attributes.$email.value.toLowerCase()
        });
        if (userByEmail) {
          console.log(`✅ [RevenueCat] Found user by email attribute: ${userByEmail._id}`);
          // Update the user's revenuecatAppUserId to include this anonymous ID for future lookups
          if (!userByEmail.revenuecatAppUserId) {
            userByEmail.revenuecatAppUserId = userByEmail._id.toString();
            await userByEmail.save();
          }
          return { user: userByEmail, resolvedAppUserId: appUserId };
        }
      }

      // Try MongoDB _id pattern extraction from non-anonymous aliases
      // RevenueCat API v1 doesn't expose aliases, so we need to query with potential IDs
      // The app uses MongoDB _id as the logged-in user ID
      // Let's try to find users who have revenuecatAppUserId set and check if they match
      const allUsersWithRevenueCat = await User.find({
        revenuecatAppUserId: { $exists: true, $ne: null }
      }).select('_id revenuecatAppUserId email');

      for (const potentialUser of allUsersWithRevenueCat) {
        // Check if this user's revenuecatAppUserId (MongoDB _id) is an alias of the anonymous ID
        const potentialSubscriber = await fetchSubscriberFromRevenueCat(potentialUser.revenuecatAppUserId);
        if (potentialSubscriber) {
          // If we can fetch subscriber data with this ID, check if it's the same subscription
          const activeEnt = getActiveEntitlement(potentialSubscriber);
          if (activeEnt) {
            // Compare with the original anonymous subscriber's data
            const anonActiveEnt = getActiveEntitlement(subscriber);
            if (anonActiveEnt &&
                activeEnt.product_identifier === anonActiveEnt.product_identifier &&
                activeEnt.original_purchase_date === anonActiveEnt.original_purchase_date) {
              console.log(`✅ [RevenueCat] Found matching user via subscription comparison: ${potentialUser._id}`);
              return { user: potentialUser, resolvedAppUserId: potentialUser.revenuecatAppUserId };
            }
          }
        }
      }
    }
  }

  // Last resort: check if any user has this exact ID stored
  // (handles edge cases)
  const usersByExactMatch = await User.find({
    $or: [
      { revenuecatAppUserId: appUserId },
      { _id: appUserId.match(/^[0-9a-fA-F]{24}$/) ? appUserId : null }
    ].filter(q => q._id !== null || q.revenuecatAppUserId)
  });

  if (usersByExactMatch.length > 0) {
    console.log(`✅ [RevenueCat] Found user in last resort search: ${usersByExactMatch[0]._id}`);
    return { user: usersByExactMatch[0], resolvedAppUserId: appUserId };
  }

  console.log(`⚠️ [RevenueCat] Could not find user for app_user_id: ${appUserId}`);
  return { user: null, resolvedAppUserId: null };
}

/**
 * Create subscription record from RevenueCat subscriber data
 * Used when we need to manually sync a subscription
 */
async function createSubscriptionFromSubscriber(user, appUserId, subscriber) {
  const entitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || "Pro";
  const activeEntitlement = getActiveEntitlement(subscriber, entitlementId);

  if (!activeEntitlement) {
    console.log(`⚠️ [RevenueCat] No active entitlement found for user: ${user._id}`);
    return null;
  }

  return await syncSubscriptionToDatabase(user, appUserId, subscriber, activeEntitlement);
}

module.exports = {
  fetchSubscriberFromRevenueCat,
  getActiveEntitlement,
  verifyAndSyncSubscription,
  findUserByRevenueCatId,
  createSubscriptionFromSubscriber
};
