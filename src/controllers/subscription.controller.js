const stripe = require("../config/stripe");
require("dotenv").config();
const User = require("../models/user.model");
const Subscription = require("../models/subscription.model");

// Helper function to safely convert Stripe timestamps to Date objects
const safeTimestampToDate = (timestamp) => {
  if (!timestamp || timestamp === null || timestamp === undefined) {
    return null;
  }
  const date = new Date(timestamp * 1000);
  return isNaN(date.getTime()) ? null : date;
};

const createSubscription = async (req, res) => {
  try {
    const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    const userId = req.userId;

    console.log("Creating subscription for user:", userId, "with price:", priceId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      console.log("Creating new Stripe customer");
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
      console.log("Created customer:", customerId);
    }

    // Create subscription
    console.log("Creating subscription...");
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    console.log("Subscription created:", subscription.id);
    console.log("Latest invoice status:", subscription.latest_invoice?.status);
    console.log("Payment intent:", subscription.latest_invoice?.payment_intent?.id);

    let clientSecret = null;
    let finalSubscription = subscription;

    // Handle different invoice statuses
    if (subscription.latest_invoice) {
      if (subscription.latest_invoice.status === "draft") {
        console.log("Invoice is draft, finalizing...");
        try {
          // Finalize the draft invoice
          const finalizedInvoice = await stripe.invoices.finalizeInvoice(
            subscription.latest_invoice.id
          );
          console.log("Invoice finalized:", finalizedInvoice.id, "Status:", finalizedInvoice.status);

          // Retrieve updated subscription
          finalSubscription = await stripe.subscriptions.retrieve(
            subscription.id,
            { expand: ["latest_invoice.payment_intent"] }
          );

          clientSecret = finalSubscription.latest_invoice?.payment_intent?.client_secret;
          console.log("Client secret from finalized invoice:", clientSecret ? "Present" : "Missing");
        } catch (finalizeError) {
          console.error("Error finalizing invoice:", finalizeError);
        }
      } else if (subscription.latest_invoice.payment_intent) {
        // Invoice is already finalized
        clientSecret = subscription.latest_invoice.payment_intent.client_secret;
        console.log("Client secret from existing invoice:", clientSecret ? "Present" : "Missing");
      }
    }

    // If still no client secret, try to retrieve the invoice separately
    if (!clientSecret && subscription.latest_invoice) {
      try {
        console.log("Retrieving invoice separately...");
        const invoice = await stripe.invoices.retrieve(
          subscription.latest_invoice.id || subscription.latest_invoice,
          { expand: ["payment_intent"] }
        );
        
        console.log("Retrieved invoice status:", invoice.status);
        console.log("Retrieved invoice payment_intent:", invoice.payment_intent?.id);

        if (invoice.payment_intent) {
          clientSecret = invoice.payment_intent.client_secret;
          console.log("Client secret from retrieved invoice:", clientSecret ? "Present" : "Missing");
        } else if (invoice.status === "open") {
          // For open invoices, try to pay them to create payment intent
          console.log("Invoice is open, attempting to create payment intent...");
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: invoice.amount_due,
              currency: invoice.currency,
              customer: customerId,
              metadata: {
                invoice_id: invoice.id,
                subscription_id: subscription.id,
              },
            });
            clientSecret = paymentIntent.client_secret;
            console.log("Created separate payment intent:", paymentIntent.id);
          } catch (piError) {
            console.error("Error creating payment intent:", piError);
          }
        }
      } catch (retrieveError) {
        console.error("Error retrieving invoice:", retrieveError);
      }
    }

    // Save to database with safe date conversion
    const newSubscription = new Subscription({
      user: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: finalSubscription.id,
      priceId: priceId,
      status: finalSubscription.status,
      currentPeriodStart: safeTimestampToDate(finalSubscription.current_period_start),
      currentPeriodEnd: safeTimestampToDate(finalSubscription.current_period_end),
      latestInvoiceId:
        typeof finalSubscription.latest_invoice === "object"
          ? finalSubscription.latest_invoice.id
          : finalSubscription.latest_invoice,
    });

    await newSubscription.save();
    console.log("Subscription saved to database");

    const responseData = {
      subscriptionId: finalSubscription.id,
      customerId: customerId,
      status: finalSubscription.status,
    };

    if (clientSecret) {
      responseData.clientSecret = clientSecret;
      console.log("Sending response with client secret");
    } else {
      console.log("WARNING: No client secret available");
    }

    res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("Subscription creation error:", error);
    res.status(500).json({
      error: "Failed to create subscription",
      details: error.message,
    });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.userId; // Fixed: should be req.userId not req.user.id

    const subscription = await Subscription.findOne({ user: userId }).sort({
      createdAt: -1,
    });

    if (!subscription) {
      return res.status(404).json({ error: "No subscription found" });
    }

    // Get latest status from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Update local status if different
    if (stripeSubscription.status !== subscription.status) {
      subscription.status = stripeSubscription.status;
      subscription.currentPeriodStart = safeTimestampToDate(
        stripeSubscription.current_period_start
      );
      subscription.currentPeriodEnd = safeTimestampToDate(
        stripeSubscription.current_period_end
      );
      await subscription.save();
    }

    res.status(200).json({
      status: stripeSubscription.status,
      currentPeriodStart: stripeSubscription.current_period_start,
      currentPeriodEnd: stripeSubscription.current_period_end,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const userId = req.userId; // Fixed: should be req.userId not req.user.id
    const { cancelImmediately = false } = req.body;

    const subscription = await Subscription.findOne({ user: userId }).sort({
      createdAt: -1,
    });

    if (!subscription) {
      return res.status(404).json({ error: "No subscription found" });
    }

    const updateData = cancelImmediately
      ? {} // Cancel immediately
      : { cancel_at_period_end: true }; // Cancel at period end

    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      updateData
    );

    if (cancelImmediately) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update local subscription
    subscription.cancelAtPeriodEnd = !cancelImmediately;
    if (cancelImmediately) {
      subscription.status = "canceled";
      subscription.endedAt = new Date();
    }
    await subscription.save();

    res.status(200).json({
      message: cancelImmediately
        ? "Subscription canceled"
        : "Subscription will cancel at period end",
      cancelAtPeriodEnd: !cancelImmediately,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

const webhookHandler = async (req, res) => {
  console.log("Received Stripe webhook event");
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Webhook signature verification successful");
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received event: ${event.type}`);
  console.log(`Event data:`, JSON.stringify(event.data.object, null, 2));

  try {
    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
        console.log("Processing subscription created");
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        console.log("Processing subscription updated");
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        console.log("Processing subscription deleted");
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        console.log("Processing payment succeeded");
        console.log(`Invoice ID: ${event.data.object.id}`);
        console.log(`Subscription ID: ${event.data.object.subscription}`);
        console.log(`Amount paid: ${event.data.object.amount_paid}`);
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        console.log("Processing payment failed");
        console.log(`Invoice ID: ${event.data.object.id}`);
        console.log(`Subscription ID: ${event.data.object.subscription}`);
        await handlePaymentFailed(event.data.object);
        break;

      case "invoice.created":
        console.log("Invoice created");
        console.log(`Invoice ID: ${event.data.object.id}`);
        console.log(`Invoice status: ${event.data.object.status}`);
        break;

      case "invoice.finalized":
        console.log("Invoice finalized");
        console.log(`Invoice ID: ${event.data.object.id}`);
        console.log(`Invoice status: ${event.data.object.status}`);
        break;

      case "payment_intent.succeeded":
        console.log("Payment Intent succeeded");
        console.log(`Payment Intent ID: ${event.data.object.id}`);
        console.log(`Amount: ${event.data.object.amount}`);
        break;

      case "payment_intent.payment_failed":
        console.log("Payment Intent failed");
        console.log(`Payment Intent ID: ${event.data.object.id}`);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    console.log(`Event ${event.type} processed successfully`);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

const handleSubscriptionCreated = async (subscription) => {
  try {
    console.log("Subscription created:", subscription.id);

    const updateData = {
      status: subscription.status,
      currentPeriodStart: safeTimestampToDate(
        subscription.current_period_start
      ),
      currentPeriodEnd: safeTimestampToDate(subscription.current_period_end),
      defaultPaymentMethod: subscription.default_payment_method,
    };

    // Remove null values to avoid updating with null
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === null) {
        delete updateData[key];
      }
    });

    const result = await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      updateData,
      { new: true }
    );

    if (result) {
      console.log(`Subscription updated in DB: ${subscription.id}`);
    } else {
      console.log(`Subscription not found in DB: ${subscription.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription created:", error);
    throw error;
  }
};

const handleSubscriptionUpdated = async (subscription) => {
  try {
    console.log("Subscription updated:", subscription.id);

    const updateData = {
      status: subscription.status,
      currentPeriodStart: safeTimestampToDate(
        subscription.current_period_start
      ),
      currentPeriodEnd: safeTimestampToDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      defaultPaymentMethod: subscription.default_payment_method,
    };

    if (subscription.canceled_at) {
      updateData.endedAt = safeTimestampToDate(subscription.canceled_at);
    }

    if (subscription.cancel_at) {
      updateData.cancelAt = safeTimestampToDate(subscription.cancel_at);
    }

    // Remove null values to avoid updating with null
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === null) {
        delete updateData[key];
      }
    });

    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      updateData,
      { new: true }
    );

    console.log(
      `Subscription updated: ${subscription.id}, Status: ${subscription.status}`
    );
  } catch (error) {
    console.error("Error handling subscription updated:", error);
    throw error;
  }
};

const handleSubscriptionDeleted = async (subscription) => {
  try {
    console.log("Subscription deleted:", subscription.id);

    const updateData = {
      status: "canceled",
    };

    if (subscription.canceled_at) {
      updateData.endedAt = safeTimestampToDate(subscription.canceled_at);
    }

    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      updateData,
      { new: true }
    );

    console.log(`Subscription marked as deleted: ${subscription.id}`);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
    throw error;
  }
};

const handlePaymentSucceeded = async (invoice) => {
  try {
    console.log("Payment succeeded for invoice:", invoice.id);

    if (invoice.subscription) {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: invoice.subscription },
        {
          latestInvoiceId: invoice.id,
          status: "active", // Payment succeeded, so subscription is active
        },
        { new: true }
      );

      console.log(
        `Payment succeeded for subscription: ${invoice.subscription}`
      );
    }
  } catch (error) {
    console.error("Error handling payment succeeded:", error);
    throw error;
  }
};

const handlePaymentFailed = async (invoice) => {
  try {
    console.log("Payment failed for invoice:", invoice.id);

    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription
      );

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: invoice.subscription },
        {
          latestInvoiceId: invoice.id,
          status: subscription.status, // Update with current Stripe status
        },
        { new: true }
      );

      console.log(`Payment failed for subscription: ${invoice.subscription}`);
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
    throw error;
  }
};

module.exports = {
  webhookHandler,
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
};
