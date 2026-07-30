import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getOrInitVapidKeys, sendWebPushNotification } from "@/lib/push";
import { apiError, validationError } from "@/lib/api-errors";
import { getPushIconUrl, getPushBadgeUrl } from "@/lib/site";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getDB();
    const vapid = await getOrInitVapidKeys(db);
    return NextResponse.json({ publicKey: vapid.publicKey });
  } catch (err) {
    return apiError(err, 500, "Couldn't set up alerts. Please try again.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, keys } = body?.subscription || body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return validationError("Couldn't save alert subscription. Please try again.");
    }

    const db = getDB();

    const subId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await db
      .prepare(
        "INSERT INTO push_subscriptions (id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth"
      )
      .bind(subId, endpoint, keys.p256dh, keys.auth)
      .run();

    const vapid = await getOrInitVapidKeys(db);
    const welcomeResult = await sendWebPushNotification(
      { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      {
        title: "Welcome to AN Fitness alerts!",
        body: "You're subscribed. Stay tuned for gym events, schedules, and announcements.",
        icon: getPushIconUrl(),
        badge: getPushBadgeUrl(),
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
      message: "Alerts turned on successfully!",
    });
  } catch (err) {
    return apiError(err, 500, "Couldn't save alert subscription. Please try again.");
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { endpoint } = body || {};

    if (!endpoint) {
      return validationError("Couldn't turn off alerts. Please try again.");
    }

    const db = getDB();
    await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(endpoint).run();

    return NextResponse.json({ success: true, message: "Alerts turned off." });
  } catch (err) {
    return apiError(err, 500, "Couldn't turn off alerts. Please try again.");
  }
}
