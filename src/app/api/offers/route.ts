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

export async function GET() {
  try {
    const db = getDB();
    const { results } = await db.prepare("SELECT * FROM offers").all();
    return NextResponse.json(results || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch offers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, subtitle, price, badge, features, whatsappText, active } = body;

    if (!id || !title || !price) {
      return NextResponse.json({ error: "id, title, and price are required fields" }, { status: 400 });
    }

    const db = getDB();
    await db
      .prepare(
        "INSERT INTO offers (id, title, subtitle, price, badge, features, whatsappText, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        id,
        title,
        subtitle || "",
        price,
        badge || "",
        typeof features === "string" ? features : JSON.stringify(features || []),
        whatsappText || "",
        active ? 1 : 0
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create offer" }, { status: 500 });
  }
}
