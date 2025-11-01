const stripe = require("../config/stripe");
require("dotenv").config();
const User = require("../models/user.model");
const Subscription = require("../models/subscription.model");

const getOrCreateCustomer = async (userId) => {
  const user = await User.findById(userId);

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullname,
    phone: user.phoneNumber,
    metadata: {
      userId: user._id.toString(),
    },
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
};

const createSubscription = async (req, res) => {
  try {
    const { paymentMethodId, priceId } = req.body;
    const userId = req.userId;

    const customerId = await getOrCreateCustomer(userId);

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ["latest_invoice.payment_intent", "latest_invoice"],
    });

    const tsToDate = (ts) =>
      typeof ts === "number" && !isNaN(ts) ? new Date(ts * 1000) : undefined;

    const latestInvoiceId = (() => {
      const li = subscription.latest_invoice;
      if (!li) return undefined;
      if (typeof li === "string") return li;
      if (typeof li === "object" && li.id) return li.id;
      return undefined;
    })();

    const newSubscription = new Subscription({
      user: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      priceId: priceId,
      status: subscription.status,
      currentPeriodStart: tsToDate(subscription.current_period_start),
      currentPeriodEnd: tsToDate(subscription.current_period_end),
      defaultPaymentMethod: paymentMethodId,
      latestInvoiceId: latestInvoiceId,
    });

    await newSubscription.save();

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    res.status(400).json({ error: error.message });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const subscriptions = await Subscription.find({ user: userId })
      .sort({
        createdAt: -1,
      })
      .limit(1);

    res.json(subscriptions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const userId = req.userId;

    // Validate input
    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    // Find the subscription in database
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    // Check if subscription exists
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Verify the subscription belongs to the requesting user
    if (subscription.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized access to subscription" });
    }

    // Check if subscription is already cancelled or set to cancel
    if (subscription.status === "canceled") {
      return res.status(400).json({
        error: "Subscription is already cancelled",
        alreadyCancelled: true
      });
    }

    if (subscription.cancelAtPeriodEnd) {
      return res.status(400).json({
        error: "Subscription is already scheduled for cancellation",
        alreadyCancelled: true,
        cancelAt: subscription.cancelAt
      });
    }

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update local database
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: canceledSubscription.status,
        cancelAtPeriodEnd: true,
        cancelAt: new Date(canceledSubscription.cancel_at * 1000),
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Subscription will be cancelled at the end of the billing period",
      cancelAt: updatedSubscription.cancelAt,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);

    // Handle Stripe-specific errors
    if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        error: "Invalid subscription. Please contact support."
      });
    }

    res.status(500).json({
      error: error.message || "Failed to cancel subscription"
    });
  }
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const webhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "customer.created":
        console.log("Customer created:", event.data.object.id);
        break;

      case "customer.updated":
        console.log("Customer updated:", event.data.object.id);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(400).json({ error: error.message });
  }
};

async function handleSubscriptionCreated(subscription) {
  console.log("Subscription created:", subscription.id);

  const tsToDate = (ts) =>
    typeof ts === "number" && !isNaN(ts) ? new Date(ts * 1000) : undefined;

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      status: subscription.status,
      currentPeriodStart: tsToDate(subscription.current_period_start),
      currentPeriodEnd: tsToDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    { upsert: false }
  );
}

async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id);

  const tsToDate = (ts) =>
    typeof ts === "number" && !isNaN(ts) ? new Date(ts * 1000) : undefined;

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      status: subscription.status,
      currentPeriodStart: tsToDate(subscription.current_period_start),
      currentPeriodEnd: tsToDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: tsToDate(subscription.cancel_at),
      endedAt: tsToDate(subscription.ended_at),
    }
  );
}

async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id);

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      status: "canceled",
      endedAt: new Date(),
    }
  );
}

async function handlePaymentSucceeded(invoice) {
  console.log("Payment succeeded for invoice:", invoice.id);

  if (invoice.subscription) {
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: invoice.subscription },
      {
        latestInvoiceId: invoice.id,
        status: "active",
      }
    );
  }
}

async function handlePaymentFailed(invoice) {
  console.log("Payment failed for invoice:", invoice.id);

  if (invoice.subscription) {
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: invoice.subscription },
      {
        latestInvoiceId: invoice.id,
        status: "past_due",
      }
    );
  }
}

const reactivateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const userId = req.userId;

    // Validate input
    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    // Find the subscription in database
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    // Check if subscription exists
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Verify the subscription belongs to the requesting user
    if (subscription.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized access to subscription" });
    }

    // Check if subscription is already active (not scheduled for cancellation)
    if (!subscription.cancelAtPeriodEnd) {
      return res.status(400).json({
        error: "Subscription is already active and not scheduled for cancellation",
        alreadyActive: true
      });
    }

    // Check if subscription has already ended
    if (subscription.status === "canceled" && subscription.endedAt) {
      return res.status(400).json({
        error: "Subscription has already ended. Please create a new subscription.",
        subscriptionEnded: true
      });
    }

    // Reactivate the subscription in Stripe
    const reactivatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    // Update local database
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: reactivatedSubscription.status,
        cancelAtPeriodEnd: false,
        cancelAt: null,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Subscription has been reactivated successfully",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Reactivate subscription error:", error);

    // Handle Stripe-specific errors
    if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        error: "Invalid subscription. Please contact support."
      });
    }

    res.status(500).json({
      error: error.message || "Failed to reactivate subscription"
    });
  }
};

module.exports = {
  webhookHandler,
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
};
