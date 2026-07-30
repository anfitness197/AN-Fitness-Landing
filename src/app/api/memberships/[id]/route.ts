import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { apiError, unauthorizedError, validationError } from "@/lib/api-errors";

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
    const { name, price, billing, features, popular, badge } = body;

    if (!name || price === undefined) {
      return validationError("Please enter a plan name and price.");
    }

    const db = getDB();
    await db
      .prepare(
        "UPDATE memberships SET name = ?, price = ?, billing = ?, features = ?, popular = ?, badge = ? WHERE id = ?"
      )
      .bind(
        name,
        Number(price),
        billing || "",
        typeof features === "string" ? features : JSON.stringify(features || []),
        popular ? 1 : 0,
        badge || "",
        id
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 500, "Couldn't update membership plan. Please try again.");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  const { id } = params;

  try {
    const db = getDB();
    await db.prepare("DELETE FROM memberships WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 500, "Couldn't delete membership plan. Please try again.");
  }
}
