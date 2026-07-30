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
    const { results } = await db.prepare("SELECT * FROM offers").all();
    return jsonCached(results || [], 60);
  } catch (err) {
    return apiError(err, 500, "Couldn't load offers. Please try again.");
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const body = await request.json();
    const { id, title, subtitle, price, badge, features, whatsappText, active } = body;

    if (!id || !title || !price) {
      return validationError("Please enter a title and price.");
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
  } catch (err) {
    return apiError(err, 500, "Couldn't save offer. Please try again.");
  }
}
