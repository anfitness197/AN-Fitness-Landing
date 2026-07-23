import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getOrInitVapidKeys, sendWebPushNotification } from "@/lib/push";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getDB();
    const vapid = await getOrInitVapidKeys(db);
    return NextResponse.json({ publicKey: vapid.publicKey });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch VAPID key" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, keys } = body?.subscription || body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid push subscription object. Required fields: endpoint, keys.p256dh, keys.auth" },
        { status: 400 }
      );
    }

    const db = getDB();

    await db.exec(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const subId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await db
      .prepare(
        "INSERT OR REPLACE INTO push_subscriptions (id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)"
      )
      .bind(subId, endpoint, keys.p256dh, keys.auth)
      .run();

    
    const vapid = await getOrInitVapidKeys(db);
    const welcomeResult = await sendWebPushNotification(
      { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      {
        title: "🎉 Welcome to AN Fitness Alerts!",
        body: "You have successfully subscribed to push notifications. Stay tuned for exciting gym events, schedules & announcements!",
        icon: "/assets/logos/favicon.svg",
        url: "/events",
        type: "notification",
        tag: "welcome-push-alert",
      },
      vapid
    );

    if (!welcomeResult.success) {
      console.error("Welcome push notification failed:", welcomeResult.error);
    }

    return NextResponse.json({
      success: true,
      message: welcomeResult.success
        ? "Subscribed to push notifications successfully! Welcome notification sent."
        : `Subscribed successfully, but welcome push service returned: ${welcomeResult.error || "Delivery pending"}`,
      welcomeResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { endpoint } = body || {};

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    const db = getDB();
    await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(endpoint).run();

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove subscription" }, { status: 500 });
  }
}
