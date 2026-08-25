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
    let results: { id: string; name: string | null; image: string; created_at?: number }[] = [];
    try {
      const stmt = db.prepare("SELECT * FROM products ORDER BY created_at DESC, rowid DESC");
      const res = await stmt.all();
      results = res.results || [];
    } catch {
      const fallbackStmt = db.prepare("SELECT * FROM products ORDER BY rowid DESC");
      const res = await fallbackStmt.all();
      results = res.results || [];
    }
    return jsonCached(results, 60);
  } catch (err) {
    return apiError(err, 500, "Couldn't load products. Please try again.");
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) return unauthorizedError();
  try {
    const body = await request.json();
    const { id, name, image } = body;
    if (!id || !image) return validationError("Please provide a product image.");
    const createdAt = Date.now();
    const db = getDB();
    try {
      await db.prepare("INSERT INTO products (id, name, image, created_at) VALUES (?, ?, ?, ?)").bind(id, name, image, createdAt).run();
    } catch {
      await db.exec("ALTER TABLE products ADD COLUMN created_at INTEGER DEFAULT 0").catch(() => {});
      await db.prepare("INSERT INTO products (id, name, image, created_at) VALUES (?, ?, ?, ?)").bind(id, name, image, createdAt).run();
    }
    try { revalidatePath("/shop"); revalidatePath("/"); } catch {}
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 500, "Couldn't save product. Please try again.");
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAuth())) return unauthorizedError();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return validationError("Please select a product to delete.");
    const db = getDB();
    await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
    try { revalidatePath("/shop"); revalidatePath("/"); } catch {}
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    return apiError(err, 500, "Couldn't delete product. Please try again.");
  }
}
