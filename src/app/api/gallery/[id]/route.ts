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

  const rawId = params.id ? decodeURIComponent(params.id) : "";

  try {
    const db = getDB();

    const item = await db
      .prepare("SELECT * FROM gallery WHERE id = ? OR id = ?")
      .bind(rawId, params.id)
      .first<{ id: string; url: string }>();

    if (item) {
      try {
        const r2 = getR2();
        let key = item.id;
        try {
          const urlObj = new URL(item.url);
          key = urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname;
        } catch {}
        await r2.delete(key).catch(() => {});
      } catch {}

      await db.prepare("DELETE FROM gallery WHERE id = ? OR id = ?").bind(item.id, rawId).run();
    } else {
      await db.prepare("DELETE FROM gallery WHERE id = ? OR id = ?").bind(rawId, params.id).run();
    }

    return NextResponse.json({ success: true, message: "Gallery item deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete gallery item" }, { status: 500 });
  }
}
