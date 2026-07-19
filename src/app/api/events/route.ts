import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";

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
    return NextResponse.json(results || []);
  } catch (err: any) {
    // Return empty list if table or query fails gracefully
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, description, date, time, location, posterUrl, category } = body || {};

    const cleanTitle = (title || "").toString().trim();
    const cleanDesc = (description || "").toString().trim();

    if (!cleanTitle || !cleanDesc) {
      return NextResponse.json(
        { error: "Event title and description text are required" },
        { status: 400 }
      );
    }

    const eventId = id || `event-${Date.now()}`;
    const db = getDB();

    // Ensure events table exists
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await db
      .prepare(
        "INSERT OR REPLACE INTO events (id, title, description, date, time, location, posterUrl, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        eventId,
        cleanTitle,
        cleanDesc,
        (date || "").toString().trim(),
        (time || "").toString().trim(),
        (location || "").toString().trim(),
        (posterUrl || "").toString().trim(),
        (category || "General").toString().trim()
      )
      .run();

    return NextResponse.json({ success: true, id: eventId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create event" }, { status: 500 });
  }
}
