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
    const { title, subtitle, price, badge, features, whatsappText, active } = body;

    if (!title || !price) {
      return NextResponse.json({ error: "title and price are required fields" }, { status: 400 });
    }

    const db = getDB();
    await db
      .prepare(
        "UPDATE offers SET title = ?, subtitle = ?, price = ?, badge = ?, features = ?, whatsappText = ?, active = ? WHERE id = ?"
      )
      .bind(
        title,
        subtitle || "",
        price,
        badge || "",
        typeof features === "string" ? features : JSON.stringify(features || []),
        whatsappText || "",
        active ? 1 : 0,
        id
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update offer" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const db = getDB();
    await db.prepare("DELETE FROM offers WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete offer" }, { status: 500 });
  }
}
