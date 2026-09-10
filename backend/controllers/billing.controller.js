import Stripe from "stripe";
import User from "../models/user.model.js";

const stripe = new Stripe(/** @type {string} */ (process.env.STRIPE_SECRET_KEY));

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // MOCK: Instantly upgrade user to pro
    user.subscriptionTier = "pro";
    await user.save();

    res.json({ url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/main?success=true` });
  } catch (error) {
    console.error("Mock Stripe error:", error);
    res.status(500).json({ error: "Failed to create mock checkout session" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const createPortalSession = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // MOCK: Instantly downgrade user to free
    user.subscriptionTier = "free";
    await user.save();

    res.json({ url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/main?canceled=true` });
  } catch (error) {
    console.error("Mock Portal error:", error);
    res.status(500).json({ error: "Failed to create mock portal session" });
  }
};

// Webhook to handle Stripe events (needs raw body in express)
/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Make sure body is raw Buffer in app.js for this route
      /** @type {string | string[]} */ (sig),
      /** @type {string} */ (process.env.STRIPE_WEBHOOK_SECRET)
    );
  } catch (err) {
    const error = /** @type {Error} */ (err);
    console.error(`Webhook signature verification failed:`, error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { subscriptionTier: "pro", stripeSubscriptionId: subscriptionId }
      );
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { subscriptionTier: "free", stripeSubscriptionId: null }
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};
