// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/app/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Ensure this matches your error message version
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId } = body;

    // --- PRICING STRATEGY (THB) ---
    // Option 1: Starter (Decoy) - 35 THB (~$1) for 100 Tokens
    // Option 2: Pro (Best Value) - 150 THB (~$4.50) for 500 Tokens

    let priceAmount = 3500; // 35.00 THB (Stripe expects satang/cents)
    let tokenAmount = 100;
    let packageName = "Starter Token Pack";

    let isProAccess = false;
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "payment";

    if (packageId === 'pack500') {
      priceAmount = 12000; // 120.00 THB
      tokenAmount = 500;
      packageName = "Pro Token Pack (500)";
    } else if (packageId === 'pro') {
      priceAmount = 9900; // 99.00 THB
      tokenAmount = 0; // Unlimited
      packageName = "Planner Pro (30 Days)";
      isProAccess = true;
      mode = "payment"; // We use prepaid to support PromptPay
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "promptpay"],
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: packageName,
              description: isProAccess ? "Unlimited AI Features for 30 Days" : `${tokenAmount} AI Generation Tokens`,
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${process.env.NEXTAUTH_URL}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}?canceled=true`,
      metadata: {
        userId: (session.user as any).id,
        packageId: packageId,
        tokensToAdd: tokenAmount.toString(),
        isProAccess: isProAccess ? "true" : "false", // Tells webhook this is a Pro purchase
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}