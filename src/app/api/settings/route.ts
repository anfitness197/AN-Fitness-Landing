import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { apiError, unauthorizedError, validationError } from "@/lib/api-errors";
import { jsonCached } from "@/lib/http-cache";

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
      return jsonCached(defaultBanner, 60);
    }

    const data = JSON.parse(result.value);
    return jsonCached(data, 60);
  } catch (err) {
    return apiError(err, 500, "Couldn't load settings. Please try again.");
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const body = await request.json();
    const { badge, text, active } = body;

    if (!text) {
      return validationError("Please enter announcement text.");
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
  } catch (err) {
    return apiError(err, 500, "Couldn't save announcement. Please try again.");
  }
}
