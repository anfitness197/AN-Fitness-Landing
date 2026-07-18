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
    const { name, price, billing, features, popular, badge } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "name and price are required fields" }, { status: 400 });
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update membership" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const db = getDB();
    await db.prepare("DELETE FROM memberships WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete membership" }, { status: 500 });
  }
}
