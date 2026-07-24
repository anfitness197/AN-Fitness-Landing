import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { broadcastPushNotification, getOrInitVapidKeys } from "@/lib/push";

export const runtime = "edge";

async function checkAuth() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDB();
    const vapid = await getOrInitVapidKeys(db);

    const { results } = await db.prepare("SELECT COUNT(*) as count FROM push_subscriptions").all();
    const count = (results?.[0] as any)?.count || 0;

    return NextResponse.json({
      subscriberCount: count,
      vapidPublicKey: vapid.publicKey,
      vapidSubject: vapid.subject,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch push status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, message, bodyText, image, url, type, saveToBulletin = true } = body || {};

    const cleanTitle = (title || "").toString().trim();
    const cleanBody = (message || bodyText || "").toString().trim();

    if (!cleanTitle || !cleanBody) {
      return NextResponse.json(
        { error: "Title and message content are required for push notifications" },
        { status: 400 }
      );
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
      } catch (dbErr) {
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
      icon: "/assets/logos/web-app-manifest-192x192.png",
      image: (image || "").toString().trim() || undefined,
      url: (url || "/events").toString().trim(),
      type: itemType,
    });

    let msg = `Post published & push broadcast sent to ${result.sent} active subscriber(s)!`;
    if (result.total === 0) {
      msg = `Post published to Bulletin Board! (Note: 0 devices are subscribed to push alerts yet. Open /events on your device & click 'ENABLE PUSH ALERTS' to subscribe).`;
    } else if (result.sent === 0 && result.errors?.length) {
      msg = `Post published to Bulletin Board, but push delivery failed (${result.errors[0]}).`;
    }

    return NextResponse.json({
      success: true,
      message: msg,
      stats: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to broadcast notification" }, { status: 500 });
  }
}
