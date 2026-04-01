
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

const prisma = new PrismaClient();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const headerList = await headers();
    const sig = headerList.get("stripe-signature");

    let event: Stripe.Event;

    try {
        if (!sig || !endpointSecret) {
            throw new Error("Missing signature or secret");
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            // 1. One-time payment (Starter Pack) or Initial Subscription Payment
            case "checkout.session.completed":
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;

            // 2. Subscription Status Updates (Payment Succeeded)
            case "customer.subscription.updated": // Or invoice.payment_succeeded
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;

            // 3. Subscription Deleted/Canceled
            case "customer.subscription.deleted":
                const subDeleted = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subDeleted);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook Handler Error:", error);
        return NextResponse.json({ error: "Webhook Handler Error" }, { status: 500 });
    }
}

// --- HANDLERS ---

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    // 1. Handle One-Time Tokens
    const tokensToAdd = parseInt(session.metadata?.tokensToAdd || "0");
    if (tokensToAdd > 0) {
        await prisma.user.update({
            where: { id: userId },
            data: { tokens: { increment: tokensToAdd } },
        });
        console.log(`✅ [Webhook] Added ${tokensToAdd} tokens to user ${userId}`);
    }

    // 2. Handle Prepaid Pro Access (PromptPay/Card One-Time)
    // We treat this as a 30-day "subscription"
    const isProAccess = session.metadata?.isProAccess === "true";
    if (isProAccess) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        await prisma.user.update({
            where: { id: userId },
            data: {
                isPro: true,
                stripeCustomerId: session.customer as string || undefined,
                stripeSubscriptionId: null, // No real sub ID for one-time
                stripeCurrentPeriodEnd: thirtyDaysFromNow,
            },
        });
        console.log(`✅ [Webhook] Granted 30 days PRO access to user ${userId}`);
    }

    // 3. Handle Real Subscription (Legacy/Future)
    if (session.mode === "subscription" && session.subscription) {
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription;

        await prisma.user.update({
            where: { id: userId },
            data: {
                isPro: true,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            },
        });
        console.log(`✅ [Webhook] Upgraded user ${userId} to PRO`);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Find user by subscription ID or Customer ID
    const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
    });

    if (!user) {
        // Try finding by customer ID if sub ID not saved yet (edge case)
        const userByCust = await prisma.user.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
        });
        if (!userByCust) return; // User not found
    }

    await prisma.user.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
            isPro: subscription.status === "active" || subscription.status === "trialing",
            stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
    });
    console.log(`🔄 [Webhook] Updated subscription for customer ${subscription.customer}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            isPro: false,
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
        },
    });
    console.log(`❌ [Webhook] Subscription canceled for ${subscription.id}`);
}
