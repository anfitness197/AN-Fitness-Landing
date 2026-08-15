import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { broadcastPushNotification, getOrInitVapidKeys } from "@/lib/push";
import { apiError, unauthorizedError, validationError } from "@/lib/api-errors";
import { getPushIconUrl, absoluteUrl } from "@/lib/site";

export const runtime = "edge";

async function checkAuth() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

export async function GET() {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const db = getDB();
    const vapid = await getOrInitVapidKeys(db);

    const { results } = await db.prepare("SELECT COUNT(*) as count FROM push_subscriptions").all<{ count: number }>();
    const count = results?.[0]?.count || 0;

    return NextResponse.json({
      subscriberCount: count,
      vapidPublicKey: vapid.publicKey,
      vapidSubject: vapid.subject,
    });
  } catch (err) {
    return apiError(err, 500, "Couldn't load alert status. Please try again.");
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const body = await request.json();
    const { title, message, bodyText, image, url, type, saveToBulletin = true } = body || {};

    const cleanTitle = (title || "").toString().trim();
    const cleanBody = (message || bodyText || "").toString().trim();

    if (!cleanTitle || !cleanBody) {
      return validationError("Please enter a title and message.");
    }

    const itemType = type === "event" ? "event" : "notification";
    const db = getDB();

    if (saveToBulletin) {
      const eventId = `${itemType}-${Date.now()}`;

      try {
        await db
          .prepare(
            "INSERT OR REPLACE INTO events (id, title, description, date, time, location, posterUrl, category, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .bind(
            eventId,
            cleanTitle,
            cleanBody,
            new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            "",
            "AN Fitness, Khordha",
            (image || "").toString().trim(),
            itemType === "notification" ? "Announcement" : "Special Event",
            itemType
          )
          .run();
      } catch {
        await db.exec("ALTER TABLE events ADD COLUMN type TEXT DEFAULT 'event'").catch(() => {});
        await db
          .prepare(
            "INSERT OR REPLACE INTO events (id, title, description, date, time, location, posterUrl, category, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .bind(
            eventId,
            cleanTitle,
            cleanBody,
            new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            "",
            "AN Fitness, Khordha",
            (image || "").toString().trim(),
            itemType === "notification" ? "Announcement" : "Special Event",
            itemType
          )
          .run();
      }
    }

    const result = await broadcastPushNotification(db, {
      title: itemType === "notification" ? `📢 ${cleanTitle}` : `🏋️ ${cleanTitle}`,
      body: cleanBody.length > 120 ? `${cleanBody.substring(0, 117)}...` : cleanBody,
      icon: getPushIconUrl(),
      image: (image || "").toString().trim() ? absoluteUrl((image || "").toString().trim()) : undefined,
      url: (url || "/events").toString().trim(),
      type: itemType,
    });

    let msg = `Posted and sent to ${result.sent} subscriber(s).`;
    if (result.total === 0) {
      msg =
        "Posted to News & events. No devices are subscribed yet — open Events on a phone and turn on alerts.";
    } else if (result.sent === 0) {
      console.error("Push delivery failed:", result.errors);
      msg = "Posted to News & events, but alerts could not be delivered. Please try again later.";
    }

    return NextResponse.json({
      success: true,
      message: msg,
      stats: { sent: result.sent, failed: result.failed, total: result.total },
    });
  } catch (err) {
    return apiError(err, 500, "Couldn't send alert. Please try again.");
  }
}
