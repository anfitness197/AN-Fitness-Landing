import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { broadcastPushNotification } from "@/lib/push";

export const runtime = "edge";

async function checkAuth() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

export async function GET(request: Request) {
  try {
    const db = getDB();
    
    const { results } = await db.prepare("SELECT * FROM events ORDER BY id DESC").all();
    
    
    const items = (results || []).map((item: any) => ({
      ...item,
      type: item.type || "event",
    }));

    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, description, date, time, location, posterUrl, category, type, sendPush = true } = body || {};

    const cleanTitle = (title || "").toString().trim();
    const cleanDesc = (description || "").toString().trim();

    if (!cleanTitle || !cleanDesc) {
      return NextResponse.json(
        { error: "Title and description text are required" },
        { status: 400 }
      );
    }

    const itemType = type === "notification" ? "notification" : "event";
    const eventId = id || `${itemType}-${Date.now()}`;
    const db = getDB();

    
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
          cleanDesc,
          (date || "").toString().trim(),
          (time || "").toString().trim(),
          (location || "").toString().trim(),
          (posterUrl || "").toString().trim(),
          (category || (itemType === "notification" ? "Bulletin" : "General")).toString().trim(),
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
          cleanDesc,
          (date || "").toString().trim(),
          (time || "").toString().trim(),
          (location || "").toString().trim(),
          (posterUrl || "").toString().trim(),
          (category || (itemType === "notification" ? "Bulletin" : "General")).toString().trim(),
          itemType
        )
        .run();
    }

    
    let pushStats = null;
    if (sendPush) {
      pushStats = await broadcastPushNotification(db, {
        title: itemType === "notification" ? `📢 ${cleanTitle}` : `🏋️ New Event: ${cleanTitle}`,
        body: cleanDesc.length > 120 ? `${cleanDesc.substring(0, 117)}...` : cleanDesc,
        icon: "/icon-192.png",
        image: (posterUrl || "").toString().trim() || undefined,
        url: "/events",
        type: itemType,
      }).catch((e) => {
        console.error("Failed to broadcast push notification:", e);
        return null;
      });
    }

    return NextResponse.json({
      success: true,
      id: eventId,
      pushStats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create event/notification" }, { status: 500 });
  }
}
