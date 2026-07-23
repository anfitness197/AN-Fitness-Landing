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

    await db.exec(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

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
      await db.exec(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          date TEXT,
          time TEXT,
          location TEXT,
          posterUrl TEXT,
          category TEXT,
          type TEXT DEFAULT 'event',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

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
      icon: "/icon-192.png",
      image: (image || "").toString().trim() || undefined,
      url: (url || "/events").toString().trim(),
      type: itemType,
    });

    return NextResponse.json({
      success: true,
      message: `Unified Publish Complete: Post created & broadcasted to ${result.sent} of ${result.total} subscribers in one go!`,
      stats: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to broadcast notification" }, { status: 500 });
  }
}
