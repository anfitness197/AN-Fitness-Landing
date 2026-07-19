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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { title, description, date, time, location, posterUrl, category } = body || {};

    const cleanTitle = (title || "").toString().trim();
    const cleanDesc = (description || "").toString().trim();

    if (!cleanTitle || !cleanDesc) {
      return NextResponse.json(
        { error: "Event title and description text are required" },
        { status: 400 }
      );
    }

    const db = getDB();
    await db
      .prepare(
        "UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, posterUrl = ?, category = ? WHERE id = ?"
      )
      .bind(
        cleanTitle,
        cleanDesc,
        (date || "").toString().trim(),
        (time || "").toString().trim(),
        (location || "").toString().trim(),
        (posterUrl || "").toString().trim(),
        (category || "General").toString().trim(),
        id
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const db = getDB();
    await db.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete event" }, { status: 500 });
  }
}
