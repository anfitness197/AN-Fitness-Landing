import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { broadcastPushNotification } from "@/lib/push";
import { apiError, unauthorizedError, validationError } from "@/lib/api-errors";
import { getPushIconUrl, absoluteUrl } from "@/lib/site";
import { jsonCached } from "@/lib/http-cache";

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

    return jsonCached(items, 30);
  } catch (err) {
    return apiError(err, 500, "Couldn't load events. Please try again.");
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const body = await request.json();
    const { id, title, description, date, time, location, posterUrl, category, type, sendPush = true } = body || {};

    const cleanTitle = (title || "").toString().trim();
    const cleanDesc = (description || "").toString().trim();

    if (!cleanTitle || !cleanDesc) {
      return validationError("Please enter a title and description.");
    }

    const itemType = type === "notification" ? "notification" : "event";
    const eventId = id || `${itemType}-${Date.now()}`;
    const db = getDB();

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
          (category || (itemType === "notification" ? "Announcement" : "General")).toString().trim(),
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
          (category || (itemType === "notification" ? "Announcement" : "General")).toString().trim(),
          itemType
        )
        .run();
    }

    
    let pushStats = null;
    if (sendPush) {
      pushStats = await broadcastPushNotification(db, {
        title: itemType === "notification" ? `📢 ${cleanTitle}` : `🏋️ New Event: ${cleanTitle}`,
        body: cleanDesc.length > 120 ? `${cleanDesc.substring(0, 117)}...` : cleanDesc,
        icon: getPushIconUrl(),
        image: (posterUrl || "").toString().trim()
          ? absoluteUrl((posterUrl || "").toString().trim())
          : undefined,
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
  } catch (err) {
    return apiError(err, 500, "Couldn't save event. Please try again.");
  }
}
