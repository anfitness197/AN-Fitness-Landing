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
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const db = getDB();
    let query = "SELECT * FROM gallery ORDER BY id DESC";
    if (limit && !isNaN(Number(limit)) && Number(limit) > 0) {
      query += ` LIMIT ${parseInt(limit, 10)}`;
    }
    const { results } = await db.prepare(query).all();
    return NextResponse.json(results || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch gallery items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, url, category, title } = body;

    if (!id || !url || !category) {
      return NextResponse.json({ error: "id, url, and category are required" }, { status: 400 });
    }

    const db = getDB();
    await db
      .prepare("INSERT INTO gallery (id, url, category, title) VALUES (?, ?, ?, ?)")
      .bind(id, url, category, title || "")
      .run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create gallery item" }, { status: 500 });
  }
}
