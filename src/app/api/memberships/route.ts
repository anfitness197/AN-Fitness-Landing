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
    const { results } = await db.prepare("SELECT * FROM memberships").all();
    return NextResponse.json(results || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch memberships" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, price, billing, features, popular, badge } = body;

    if (!id || !name || price === undefined) {
      return NextResponse.json({ error: "id, name, and price are required fields" }, { status: 400 });
    }

    const db = getDB();
    await db
      .prepare(
        "INSERT INTO memberships (id, name, price, billing, features, popular, badge) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        id,
        name,
        Number(price),
        billing || "",
        typeof features === "string" ? features : JSON.stringify(features || []),
        popular ? 1 : 0,
        badge || ""
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create membership" }, { status: 500 });
  }
}
