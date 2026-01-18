// app/api/stripe/webhook/route.ts

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const prisma = new PrismaClient();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  
  // FIX: headers() is async in Next.js 15+
  const headerPayload = await headers();
  const signature = headerPayload.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    if (!signature || !endpointSecret) {
      throw new Error("Missing signature or webhook secret");
    }
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Retrieve data from metadata
    const userId = session.metadata?.userId;
    const tokensToAdd = parseInt(session.metadata?.tokensToAdd || "100");

    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { tokens: { increment: tokensToAdd } },
        });
        console.log(`✅ Added ${tokensToAdd} tokens to user ${userId}`);
      } catch (dbError) {
        console.error("Database update failed:", dbError);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}