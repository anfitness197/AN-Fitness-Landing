import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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
    const { results } = await db.prepare("SELECT * FROM memberships").all();
    return jsonCached(results || [], 60);
  } catch (err) {
    return apiError(err, 500, "Couldn't load membership plans. Please try again.");
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) return unauthorizedError();
  try {
    const body = await request.json();
    const { id, name, price, billing, features, popular, badge } = body;
    if (!id || !name || price === undefined) return validationError("Please enter a plan name and price.");
    const db = getDB();
    await db.prepare("INSERT INTO memberships (id, name, price, billing, features, popular, badge) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, name, Number(price), billing || "", typeof features === "string" ? features : JSON.stringify(features || []), popular ? 1 : 0, badge || "").run();
    try { revalidatePath("/memberships"); revalidatePath("/"); } catch {}
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 500, "Couldn't save membership plan. Please try again.");
  }
}
