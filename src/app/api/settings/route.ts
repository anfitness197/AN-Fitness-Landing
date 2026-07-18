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
    const result = await db
      .prepare("SELECT * FROM settings WHERE key = ?")
      .bind("announcement_banner")
      .first<{ key: string; value: string }>();

    if (!result) {
      const defaultBanner = {
        badge: "NEW",
        text: "REFER 4 FRIENDS & GET 1 MONTH FREE!",
        active: 1,
      };
      return NextResponse.json(defaultBanner);
    }

    const data = JSON.parse(result.value);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { badge, text, active } = body;

    if (!text) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    const db = getDB();
    const valueStr = JSON.stringify({
      badge: (badge || "").toUpperCase(),
      text,
      active: active ? 1 : 0,
    });

    await db
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .bind("announcement_banner", valueStr)
      .run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
