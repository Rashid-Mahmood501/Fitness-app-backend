require("dotenv").config();
const User = require("../models/user.model");
const RevenuecatSubscription = require("../models/revenuecatSubscription.model");
const WebhookEvent = require("../models/webhookEvent.model");
const { sendEmail } = require("../config/email");
const { findUserByRevenueCatId, fetchSubscriberFromRevenueCat } = require("../services/revenuecat.service");

// RevenueCat Webhook Handler
const revenuecatWebhookHandler = async (req, res) => {
  try {
    // Verify Bearer token authorization
    const authHeader = req.headers['authorization'];
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!authHeader) {
        console.error("❌ Missing Authorization header from RevenueCat webhook");
        return res.status(401).json({ error: "Unauthorized - Missing authorization header" });
      }

      // Expected format: "Bearer mySuperSecretWebhookKey_98123"
      const expectedAuth = `Bearer ${webhookSecret}`;

      if (authHeader !== expectedAuth) {
        console.error("❌ Invalid webhook authorization");
        console.error(`   Received: ${authHeader}`);
        console.error(`   Expected: ${expectedAuth}`);
        return res.status(401).json({ error: "Unauthorized - Invalid token" });
      }

      console.log('✅ Webhook authorization verified');
    } else {
      console.warn("⚠️ WARNING: REVENUECAT_WEBHOOK_SECRET not configured!");
      console.warn("⚠️ Webhook requests are NOT being authenticated - this is a security risk!");
    }

    // Parse raw body to JSON
    const rawBody = req.body;
    const bodyString = rawBody.toString('utf8');
    const payload = JSON.parse(bodyString);

    const eventData = payload.event;

    if (!eventData) {
      console.error("❌ Invalid webhook payload - missing event data");
      return res.status(400).json({ error: "Invalid webhook payload - missing event data" });
    }

    console.log(`📥 Received RevenueCat webhook: ${eventData.type}`);
    console.log(`   App User ID: ${eventData.app_user_id}`);
    console.log(`   Product: ${eventData.product_id || 'N/A'}`);
    console.log(`   Environment: ${eventData.environment || 'PRODUCTION'}`);

    // Log the webhook event to database
    const webhookEvent = new WebhookEvent({
      eventType: eventData.type,
      revenuecatSubscriberId: eventData.app_user_id,
      productId: eventData.product_id || "unknown",
      eventTimestamp: new Date(eventData.event_timestamp_ms || Date.now()),
      rawPayload: payload,
      environment: eventData.environment || "PRODUCTION",
      processed: false
    });

    await webhookEvent.save();
    console.log(`✅ Webhook event logged to database: ${webhookEvent._id}`);

    // Process the event
    try {
      await processWebhookEvent(eventData);
      webhookEvent.processed = true;
      await webhookEvent.save();
      console.log(`✅ Webhook event processed successfully: ${eventData.type}`);
    } catch (error) {
      console.error(`❌ Error processing webhook event:`, error.message);
      webhookEvent.processingError = error.message;
      webhookEvent.retryCount += 1;
      await webhookEvent.save();

      // Still return 200 to prevent RevenueCat from retrying immediately
      // We can reprocess failed events using the admin endpoint later
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ RevenueCat webhook handler error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Process different webhook event types
async function processWebhookEvent(eventData) {
  const {
    type,
    app_user_id,
    original_app_user_id,
    product_id,
    entitlement_ids,
    period_type,
    purchased_at_ms,
    expiration_at_ms,
    store,
    environment,
    is_trial_period,
    transaction_id,
    original_transaction_id,
    price_in_purchased_currency,
    currency,
    auto_resume_at_ms,
    cancel_reason,
    takehome_percentage
  } = eventData;

  // Find user by RevenueCat app_user_id (with alias resolution)
  let user = await User.findOne({ revenuecatAppUserId: app_user_id });

  // If not found by revenuecatAppUserId, try additional lookup methods
  if (!user) {
    console.log(`🔍 [Webhook] User not found by revenuecatAppUserId, trying additional lookups...`);

    // Try by MongoDB _id (if app_user_id is a valid ObjectId)
    if (app_user_id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(app_user_id);
      if (user) {
        console.log(`✅ [Webhook] Found user by MongoDB _id: ${user._id}`);
      }
    }

    // If still not found and it's an anonymous ID, try to resolve via RevenueCat API
    if (!user && app_user_id.startsWith('$RCAnonymousID:')) {
      console.log(`🔍 [Webhook] Anonymous ID detected, querying RevenueCat API for alias resolution...`);

      // Query RevenueCat API to get subscriber data
      const subscriber = await fetchSubscriberFromRevenueCat(app_user_id);

      if (subscriber) {
        // Try to find user by aliases - RevenueCat stores app User IDs
        // The mobile app calls Purchases.logIn(userId) with MongoDB _id
        // So there should be an alias matching the MongoDB _id

        // Check all users with revenuecatAppUserId set
        const usersWithRC = await User.find({
          revenuecatAppUserId: { $exists: true, $ne: null, $ne: '' }
        }).select('_id revenuecatAppUserId email');

        for (const potentialUser of usersWithRC) {
          // Check if this user's ID is an alias for the anonymous subscriber
          // by querying RevenueCat with their ID and comparing subscription data
          const userSubscriber = await fetchSubscriberFromRevenueCat(potentialUser.revenuecatAppUserId);

          if (userSubscriber && userSubscriber.entitlements) {
            // Compare entitlements to see if it's the same subscriber
            const subscriberEntKeys = Object.keys(subscriber.entitlements || {});
            const userEntKeys = Object.keys(userSubscriber.entitlements || {});

            if (subscriberEntKeys.length > 0 && userEntKeys.length > 0) {
              const subEnt = subscriber.entitlements[subscriberEntKeys[0]];
              const userEnt = userSubscriber.entitlements[userEntKeys[0]];

              // If same original purchase date and product, it's the same subscription
              if (subEnt && userEnt &&
                  subEnt.original_purchase_date === userEnt.original_purchase_date &&
                  subEnt.product_identifier === userEnt.product_identifier) {
                user = potentialUser;
                console.log(`✅ [Webhook] Found user via subscription matching: ${user._id} (${user.email})`);
                break;
              }
            }
          }
        }

        // Also try to find by email if RevenueCat has it
        if (!user && subscriber.subscriber_attributes?.$email?.value) {
          const email = subscriber.subscriber_attributes.$email.value.toLowerCase();
          user = await User.findOne({ email });
          if (user) {
            console.log(`✅ [Webhook] Found user by email attribute: ${user._id} (${user.email})`);
          }
        }
      }
    }
  }

  if (!user) {
    console.warn(`⚠️ [Webhook] User not found for RevenueCat app_user_id: ${app_user_id}`);
    console.log(`   Event type: ${type}`);
    console.log(`   Event logged to database but NOT processed`);
    console.log(`   💡 Tip: The subscription may be linked to an anonymous ID.`);
    console.log(`   💡 The user will still be verified via real-time API check when they access protected endpoints.`);

    // Don't process the event, but don't throw error either
    // The webhook event is already saved to database for later reprocessing
    return;
  }

  console.log(`✅ [Webhook] Found user: ${user._id} (${user.email})`);
  console.log(`   Processing ${type} event...`);

  const subscriptionData = {
    user: user._id,
    revenuecatSubscriberId: app_user_id,
    productId: product_id,
    entitlementId: entitlement_ids?.[0] || "Pro",
    platform: store,
    purchasedAt: new Date(purchased_at_ms),
    expiresAt: new Date(expiration_at_ms),
    isTrialPeriod: is_trial_period || false,
    originalTransactionId: original_transaction_id,
    storeTransactionId: transaction_id,
    periodType: period_type || "NORMAL",
    priceInPurchasedCurrency: price_in_purchased_currency,
    currency: currency,
    environment: environment,
    autoResumeDate: auto_resume_at_ms ? new Date(auto_resume_at_ms) : null
  };

  switch (type) {
    case "INITIAL_PURCHASE":
      await handleInitialPurchase(subscriptionData);
      break;

    case "RENEWAL":
      await handleRenewal(subscriptionData);
      break;

    case "CANCELLATION":
      await handleCancellation(subscriptionData, cancel_reason);
      break;

    case "UNCANCELLATION":
      await handleUncancellation(subscriptionData);
      break;

    case "NON_RENEWING_PURCHASE":
      await handleNonRenewingPurchase(subscriptionData);
      break;

    case "EXPIRATION":
      await handleExpiration(subscriptionData);
      break;

    case "BILLING_ISSUE":
      await handleBillingIssue(subscriptionData);
      break;

    case "PRODUCT_CHANGE":
      await handleProductChange(subscriptionData);
      break;

    case "TRANSFER":
      await handleTransfer(subscriptionData, original_app_user_id);
      break;

    case "SUBSCRIPTION_PAUSED":
      await handleSubscriptionPaused(subscriptionData);
      break;

    case "SUBSCRIPTION_EXTENDED":
      await handleSubscriptionExtended(subscriptionData);
      break;

    default:
      console.log(`Unhandled event type: ${type}`);
  }
}

// Event Handlers
async function handleInitialPurchase(subscriptionData) {
  console.log("📦 Processing INITIAL_PURCHASE event");
  console.log(`   User ID: ${subscriptionData.user}`);
  console.log(`   Product: ${subscriptionData.productId}`);
  console.log(`   Platform: ${subscriptionData.platform}`);
  console.log(`   Purchased: ${subscriptionData.purchasedAt}`);
  console.log(`   Expires: ${subscriptionData.expiresAt}`);
  console.log(`   Trial: ${subscriptionData.isTrialPeriod}`);

  subscriptionData.status = "active";
  subscriptionData.willRenew = true;

  const subscription = new RevenuecatSubscription(subscriptionData);
  await subscription.save();
  console.log(`✅ Subscription document created: ${subscription._id}`);

  // Send welcome email
  const user = await User.findById(subscriptionData.user);
  if (user && user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Premium!",
        html: `<h1>Thank you for subscribing!</h1><p>Your premium subscription is now active.</p>`
      });
      console.log(`📧 Welcome email sent to: ${user.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send welcome email:`, emailError.message);
    }
  } else {
    console.log(`⚠️ No email found for user, skipping welcome email`);
  }
}

async function handleRenewal(subscriptionData) {
  console.log("🔄 Processing RENEWAL event");
  console.log(`   User ID: ${subscriptionData.user}`);
  console.log(`   Product: ${subscriptionData.productId}`);
  console.log(`   Next expiration: ${subscriptionData.expiresAt}`);

  subscriptionData.status = "active";
  subscriptionData.willRenew = true;

  await RevenuecatSubscription.findOneAndUpdate(
    {
      user: subscriptionData.user,
      originalTransactionId: subscriptionData.originalTransactionId
    },
    {
      ...subscriptionData,
      unsubscribeDetectedAt: null,
      billingIssuesDetectedAt: null
    },
    { upsert: true, new: true }
  );
  console.log(`✅ Subscription renewed successfully`);

  // Send renewal confirmation email
  const user = await User.findById(subscriptionData.user);
  if (user && user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Subscription Renewed",
        html: `<h1>Your subscription has been renewed</h1><p>Next renewal: ${subscriptionData.expiresAt.toDateString()}</p>`
      });
      console.log(`📧 Renewal email sent to: ${user.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send renewal email:`, emailError.message);
    }
  }
}

async function handleCancellation(subscriptionData, cancelReason) {
  console.log("❌ Processing CANCELLATION event");
  console.log(`   User ID: ${subscriptionData.user}`);
  console.log(`   Reason: ${cancelReason || 'UNSUBSCRIBE'}`);
  console.log(`   Access until: ${subscriptionData.expiresAt}`);

  await RevenuecatSubscription.findOneAndUpdate(
    {
      user: subscriptionData.user,
      originalTransactionId: subscriptionData.originalTransactionId
    },
    {
      status: "cancelled",
      willRenew: false,
      unsubscribeDetectedAt: new Date(),
      cancelReason: cancelReason || "UNSUBSCRIBE"
    }
  );
  console.log(`✅ Subscription cancelled`);

  // Send cancellation email
  const user = await User.findById(subscriptionData.user);
  if (user && user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Subscription Cancelled",
        html: `<h1>Your subscription has been cancelled</h1><p>You'll continue to have access until ${subscriptionData.expiresAt.toDateString()}</p>`
      });
      console.log(`📧 Cancellation email sent to: ${user.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send cancellation email:`, emailError.message);
    }
  }
}

async function handleUncancellation(subscriptionData) {
  console.log("Processing UNCANCELLATION");

  await RevenuecatSubscription.findOneAndUpdate(
    {
      user: subscriptionData.user,
      originalTransactionId: subscriptionData.originalTransactionId
    },
    {
      status: "active",
      willRenew: true,
      unsubscribeDetectedAt: null
    }
  );
}

async function handleNonRenewingPurchase(subscriptionData) {
  console.log("Processing NON_RENEWING_PURCHASE");

  subscriptionData.status = "active";
  subscriptionData.willRenew = false;

  const subscription = new RevenuecatSubscription(subscriptionData);
  await subscription.save();
}

async function handleExpiration(subscriptionData) {
  console.log("⏱️ Processing EXPIRATION event");
  console.log(`   User ID: ${subscriptionData.user}`);
  console.log(`   Expired at: ${subscriptionData.expiresAt}`);

  await RevenuecatSubscription.findOneAndUpdate(
    {
      user: subscriptionData.user,
      originalTransactionId: subscriptionData.originalTransactionId
    },
    {
      status: "expired",
      willRenew: false
    }
  );
  console.log(`✅ Subscription marked as expired`);

  // Send expiration email
  const user = await User.findById(subscriptionData.user);
  if (user && user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Subscription Expired",
        html: `<h1>Your subscription has expired</h1><p>Resubscribe to continue enjoying premium features.</p>`
      });
      console.log(`📧 Expiration email sent to: ${user.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send expiration email:`, emailError.message);
    }
  }
}

async function handleBillingIssue(subscriptionData) {
  console.log("💳 Processing BILLING_ISSUE event");
  console.log(`   User ID: ${subscriptionData.user}`);
  console.log(`   Grace period expires: ${subscriptionData.expiresAt}`);

  await RevenuecatSubscription.findOneAndUpdate(
    {
      user: subscriptionData.user,
      originalTransactionId: subscriptionData.originalTransactionId
    },
    {
      status: "billing_issue",
      billingIssuesDetectedAt: new Date(),
      gracePeriodExpiresAt: subscriptionData.expiresAt
    }
  );
  console.log(`✅ Billing issue recorded`);

  // Send billing issue email
  const user = await User.findById(subscriptionData.user);
  if (user && user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Payment Issue with Your Subscription",
        html: `<h1>We couldn't process your payment</h1><p>Please update your payment method to continue your subscription.</p>`
      });
      console.log(`📧 Billing issue email sent to: ${user.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send billing issue email:`, emailError.message);
    }
  }
}

async function handleProductChange(subscriptionData) {
  console.log("Processing PRODUCT_CHANGE");

  await RevenuecatSubscription.findOneAndUpdate(
    {
      user: subscriptionData.user,
      originalTransactionId: subscriptionData.originalTransactionId
    },
    subscriptionData,
    { upsert: true }
  );
}

async function handleTransfer(subscriptionData, originalAppUserId) {
  console.log("Processing TRANSFER");

  // This is complex - transferring subscription from one user to another
  const oldUser = await User.findOne({ revenuecatAppUserId: originalAppUserId });

  if (oldUser) {
    // Expire old user's subscription
    await RevenuecatSubscription.updateMany(
      {
        user: oldUser._id,
        status: "active"
      },
      {
        status: "expired"
      }
    );
  }

  // Create new subscription for new user
  subscriptionData.status = "active";
  const subscription = new RevenuecatSubscription(subscriptionData);
  await subscription.save();
}

async function handleSubscriptionPaused(subscriptionData) {
  console.log("Processing SUBSCRIPTION_PAUSED");

  await RevenuecatSubscription.findOneAndUpdate(
    {
      user: subscriptionData.user,
      originalTransactionId: subscriptionData.originalTransactionId
    },
    {
      status: "paused",
      autoResumeDate: subscriptionData.autoResumeDate
    }
  );
}

async function handleSubscriptionExtended(subscriptionData) {
  console.log("Processing SUBSCRIPTION_EXTENDED");

  await RevenuecatSubscription.findOneAndUpdate(
    {
      user: subscriptionData.user,
      originalTransactionId: subscriptionData.originalTransactionId
    },
    {
      expiresAt: subscriptionData.expiresAt,
      status: "active"
    }
  );
}


// User Sync Endpoint
const syncUser = async (req, res) => {
  try {
    const { user_id, email, revenuecat_app_user_id } = req.body;

    if (!user_id || !revenuecat_app_user_id) {
      return res.status(400).json({
        error: "user_id and revenuecat_app_user_id are required"
      });
    }

    const user = await User.findByIdAndUpdate(
      user_id,
      {
        revenuecatAppUserId: revenuecat_app_user_id,
        ...(email && { email })
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        revenuecatAppUserId: user.revenuecatAppUserId
      }
    });
  } catch (error) {
    console.error("User sync error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Verify Subscription Status
const verifySubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await RevenuecatSubscription.findOne({
      user: userId,
      status: "active",
      expiresAt: { $gt: new Date() }
    }).sort({ expiresAt: -1 });

    if (!subscription) {
      return res.json({
        is_active: false,
        message: "No active subscription found"
      });
    }

    res.json({
      is_active: true,
      product_id: subscription.productId,
      entitlement: subscription.entitlementId,
      expires_at: subscription.expiresAt,
      will_renew: subscription.willRenew,
      platform: subscription.platform,
      is_trial: subscription.isTrialPeriod
    });
  } catch (error) {
    console.error("Subscription verification error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Subscription Status (detailed) - for authenticated user
const getSubscriptionStatus = async (req, res) => {
  try {
    // Get userId from auth middleware OR from params (for admin endpoints)
    const userId = req.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const subscriptions = await RevenuecatSubscription.find({
      user: userId
    }).sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Subscription History
const getSubscriptionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscriptions = await RevenuecatSubscription.find({
      user: userId
    }).sort({ createdAt: -1 });

    res.json({
      user_id: userId,
      subscriptions
    });
  } catch (error) {
    console.error("Get subscription history error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Grant Access (Admin/Support)
const grantAccess = async (req, res) => {
  try {
    const { userId, productId, durationDays } = req.body;

    if (!userId || !productId || !durationDays) {
      return res.status(400).json({
        error: "userId, productId, and durationDays are required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = new RevenuecatSubscription({
      user: userId,
      revenuecatSubscriberId: user.revenuecatAppUserId || `admin_grant_${userId}`,
      productId,
      entitlementId: "Pro",
      platform: "PROMOTIONAL",
      status: "active",
      purchasedAt: now,
      expiresAt,
      willRenew: false,
      originalTransactionId: `promo_${Date.now()}_${userId}`,
      storeTransactionId: `promo_${Date.now()}`,
      periodType: "PROMOTIONAL",
      environment: "PRODUCTION"
    });

    await subscription.save();

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error("Grant access error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Failed Webhook Events (Admin/Support)
const getFailedWebhooks = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const failedEvents = await WebhookEvent.find({
      processed: false
    })
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit));

    const total = await WebhookEvent.countDocuments({ processed: false });

    res.json({
      success: true,
      total,
      count: failedEvents.length,
      events: failedEvents.map(e => ({
        id: e._id,
        eventType: e.eventType,
        revenuecatSubscriberId: e.revenuecatSubscriberId,
        productId: e.productId,
        eventTimestamp: e.eventTimestamp,
        environment: e.environment,
        retryCount: e.retryCount,
        processingError: e.processingError,
        createdAt: e.createdAt
      }))
    });
  } catch (error) {
    console.error("❌ Get failed webhooks error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reprocess Failed Webhook Events (Admin/Support)
const reprocessFailedWebhooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Find unprocessed events with less than 5 retry attempts
    const failedEvents = await WebhookEvent.find({
      processed: false,
      retryCount: { $lt: 5 }
    })
    .sort({ createdAt: 1 })
    .limit(parseInt(limit));

    if (failedEvents.length === 0) {
      return res.json({
        success: true,
        message: "No failed events to reprocess",
        reprocessed: 0
      });
    }

    console.log(`🔄 Starting reprocessing of ${failedEvents.length} failed webhook events...`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const event of failedEvents) {
      try {
        console.log(`🔄 Reprocessing: ${event.eventType} for user ${event.revenuecatSubscriberId}`);

        await processWebhookEvent(event.rawPayload.event);

        event.processed = true;
        event.processingError = null;
        await event.save();

        successCount++;
        results.push({
          eventId: event._id,
          eventType: event.eventType,
          status: 'success'
        });

        console.log(`   ✅ Success`);
      } catch (error) {
        event.retryCount += 1;
        event.processingError = error.message;
        await event.save();

        failCount++;
        results.push({
          eventId: event._id,
          eventType: event.eventType,
          status: 'failed',
          error: error.message
        });

        console.error(`   ❌ Failed: ${error.message}`);
      }
    }

    console.log(`✅ Reprocessing complete: ${successCount} succeeded, ${failCount} failed`);

    res.json({
      success: true,
      message: "Webhook reprocessing completed",
      total: failedEvents.length,
      successful: successCount,
      failed: failCount,
      results
    });
  } catch (error) {
    console.error("❌ Reprocess webhooks error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get Webhook Statistics (Admin/Support)
const getWebhookStats = async (req, res) => {
  try {
    const total = await WebhookEvent.countDocuments();
    const processed = await WebhookEvent.countDocuments({ processed: true });
    const failed = await WebhookEvent.countDocuments({ processed: false });

    const eventTypeCounts = await WebhookEvent.aggregate([
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const recentEvents = await WebhookEvent.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('eventType revenuecatSubscriberId processed createdAt');

    res.json({
      success: true,
      stats: {
        total,
        processed,
        failed,
        successRate: total > 0 ? ((processed / total) * 100).toFixed(2) + '%' : '0%'
      },
      eventTypeCounts,
      recentEvents
    });
  } catch (error) {
    console.error("❌ Get webhook stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Debug endpoint: Verify subscription via RevenueCat API and sync to database
const debugVerifyAndSync = async (req, res) => {
  try {
    const userId = req.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log(`🔍 [Debug] Starting subscription verification for user: ${userId}`);

    const { verifyAndSyncSubscription } = require("../services/revenuecat.service");
    const result = await verifyAndSyncSubscription(userId);

    // Also check what's in the database now
    const dbSubscriptions = await RevenuecatSubscription.find({ user: userId })
      .sort({ createdAt: -1 });

    const user = await User.findById(userId).select('_id email revenuecatAppUserId');

    res.json({
      success: true,
      user: {
        id: user?._id,
        email: user?.email,
        revenuecatAppUserId: user?.revenuecatAppUserId
      },
      apiCheckResult: {
        hasActiveSubscription: result.hasActiveSubscription,
        source: result.source,
        subscription: result.subscription ? {
          id: result.subscription._id,
          productId: result.subscription.productId,
          status: result.subscription.status,
          expiresAt: result.subscription.expiresAt
        } : null
      },
      databaseSubscriptions: dbSubscriptions.map(s => ({
        id: s._id,
        productId: s.productId,
        status: s.status,
        expiresAt: s.expiresAt,
        revenuecatSubscriberId: s.revenuecatSubscriberId
      }))
    });
  } catch (error) {
    console.error("❌ [Debug] Verification error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  revenuecatWebhookHandler,
  syncUser,
  verifySubscription,
  getSubscriptionStatus,
  getSubscriptionHistory,
  grantAccess,
  getFailedWebhooks,
  reprocessFailedWebhooks,
  getWebhookStats,
  debugVerifyAndSync
};
