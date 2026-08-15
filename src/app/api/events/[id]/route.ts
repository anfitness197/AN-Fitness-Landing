import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { broadcastPushNotification } from "@/lib/push";
import { apiError, unauthorizedError, validationError } from "@/lib/api-errors";
import { getPushIconUrl, absoluteUrl } from "@/lib/site";

export const runtime = "edge";

async function checkAuth() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { title, description, date, time, location, posterUrl, category, type, sendPush } = body || {};

    const cleanTitle = (title || "").toString().trim();
    const cleanDesc = (description || "").toString().trim();

    if (!cleanTitle || !cleanDesc) {
      return validationError("Please enter a title and description.");
    }

    const itemType = type === "notification" ? "notification" : "event";
    const db = getDB();

    try {
      await db
        .prepare(
          "UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, posterUrl = ?, category = ?, type = ? WHERE id = ?"
        )
        .bind(
          cleanTitle,
          cleanDesc,
          (date || "").toString().trim(),
          (time || "").toString().trim(),
          (location || "").toString().trim(),
          (posterUrl || "").toString().trim(),
          (category || (itemType === "notification" ? "Announcement" : "General")).toString().trim(),
          itemType,
          id
        )
        .run();
    } catch {
      await db.exec("ALTER TABLE events ADD COLUMN type TEXT DEFAULT 'event'").catch(() => {});
      await db
        .prepare(
          "UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, posterUrl = ?, category = ?, type = ? WHERE id = ?"
        )
        .bind(
          cleanTitle,
          cleanDesc,
          (date || "").toString().trim(),
          (time || "").toString().trim(),
          (location || "").toString().trim(),
          (posterUrl || "").toString().trim(),
          (category || (itemType === "notification" ? "Announcement" : "General")).toString().trim(),
          itemType,
          id
        )
        .run();
    }

    let pushStats = null;
    if (sendPush) {
      pushStats = await broadcastPushNotification(db, {
        title: itemType === "notification" ? `📢 ${cleanTitle}` : `🏋️ ${cleanTitle}`,
        body: cleanDesc.length > 120 ? `${cleanDesc.substring(0, 117)}...` : cleanDesc,
        icon: getPushIconUrl(),
        image: (posterUrl || "").toString().trim()
          ? absoluteUrl((posterUrl || "").toString().trim())
          : undefined,
        url: "/events",
        type: itemType,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, pushStats });
  } catch (err) {
    return apiError(err, 500, "Couldn't update event. Please try again.");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  const { id } = params;

  try {
    const db = getDB();
    await db.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 500, "Couldn't delete event. Please try again.");
  }
}
