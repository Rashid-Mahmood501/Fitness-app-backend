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

    // Handle Apple Pay differently
    if (paymentMethodId === "apple_pay") {
      // For Apple Pay, we'll create a payment intent instead of attaching a payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 999, // $9.99 in cents
        currency: "usd",
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId,
          priceId: priceId,
        },
      });

      // Create subscription record with pending status
      const newSubscription = new Subscription({
        user: userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: `pi_${paymentIntent.id}`, // Temporary ID
        priceId: priceId,
        status: "incomplete",
        defaultPaymentMethod: "apple_pay",
      });

      await newSubscription.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        status: "incomplete",
      });
      return;
    }

    // Regular card payment flow
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

    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: canceledSubscription.status,
        cancelAtPeriodEnd: true,
        cancelAt: new Date(canceledSubscription.cancel_at * 1000),
      }
    );

    res.json({ status: "canceled" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add new function to handle Apple Pay subscription completion
const completeApplePaySubscription = async (req, res) => {
  try {
    const { paymentIntentId, priceId } = req.body;
    const userId = req.userId;

    const customerId = await getOrCreateCustomer(userId);

    // Create the actual subscription after successful Apple Pay payment
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
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

    // Update the subscription record
    await Subscription.findOneAndUpdate(
      { user: userId, stripeSubscriptionId: `pi_${paymentIntentId}` },
      {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: tsToDate(subscription.current_period_start),
        currentPeriodEnd: tsToDate(subscription.current_period_end),
        defaultPaymentMethod: "apple_pay",
        latestInvoiceId: latestInvoiceId,
      }
    );

    res.json({
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Apple Pay subscription completion error:", error);
    res.status(400).json({ error: error.message });
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

      // Handle Apple Pay payment intent succeeded
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
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

// New handler for Apple Pay payment intent success
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log("Payment intent succeeded:", paymentIntent.id);

  // If this is an Apple Pay payment, we might need to create a subscription
  if (paymentIntent.metadata && paymentIntent.metadata.priceId) {
    const userId = paymentIntent.metadata.userId;
    const priceId = paymentIntent.metadata.priceId;

    // Update the subscription status
    await Subscription.findOneAndUpdate(
      { user: userId, stripeSubscriptionId: `pi_${paymentIntent.id}` },
      {
        status: "active",
      }
    );
  }
}

module.exports = {
  webhookHandler,
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  completeApplePaySubscription,
};
