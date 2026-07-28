import Stripe from "stripe";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { ...headers, Allow: "POST" }, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const { STRIPE_SECRET_KEY, STRIPE_PRICE_ID, URL, DEPLOY_PRIME_URL } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    console.error("Stripe environment variables are not configured.");
    return { statusCode: 503, headers, body: JSON.stringify({ error: "Checkout is temporarily unavailable." }) };
  }

  const origin = (URL || DEPLOY_PRIME_URL || event.headers.origin || "").replace(/\/$/, "");
  if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "The application URL is not configured." }) };
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      metadata: { product: "threadline_deep_dive" },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    console.error("Stripe checkout failed:", error instanceof Error ? error.message : "Unknown error");
    return { statusCode: 502, headers, body: JSON.stringify({ error: "Checkout could not be created. Please try again." }) };
  }
}
