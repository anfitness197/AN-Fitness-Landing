import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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
    const { title, subtitle, price, badge, features, whatsappText, active } = body;

    if (!title || !price) {
      return validationError("Please enter a title and price.");
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
    try { revalidatePath("/memberships"); revalidatePath("/"); } catch {}
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 500, "Couldn't update offer. Please try again.");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  const { id } = params;

  try {
    const db = getDB();
    await db.prepare("DELETE FROM offers WHERE id = ?").bind(id).run();
    try { revalidatePath("/memberships"); revalidatePath("/"); } catch {}
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 500, "Couldn't delete offer. Please try again.");
  }
}
