import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB, getR2 } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export const runtime = "edge";

async function checkAuth() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const db = getDB();
    const r2 = getR2();

    // 1. Fetch item to get the key
    const item = await db
      .prepare("SELECT * FROM gallery WHERE id = ?")
      .bind(id)
      .first<{ id: string; url: string }>();

    if (!item) {
      return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
    }

    // 2. Extract key from URL
    let key = id;
    try {
      const urlObj = new URL(item.url);
      key = urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname;
    } catch (e) {
      // Fallback to id
    }

    // 3. Delete from R2
    try {
      await r2.delete(key);
    } catch (err) {
      console.error("R2 file deletion failed:", err);
      // We will proceed to delete from DB anyway so the database is kept clean
    }

    // 4. Delete from DB
    await db.prepare("DELETE FROM gallery WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete gallery item" }, { status: 500 });
  }
}
