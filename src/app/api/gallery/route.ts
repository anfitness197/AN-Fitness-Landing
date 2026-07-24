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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const category = searchParams.get("category");

    const db = getDB();
    let query = "SELECT * FROM gallery";
    const bindings: any[] = [];

    if (category && category !== "all") {
      if (category === "videos") {
        query += " WHERE type = 'video' OR url LIKE '%.mp4' OR url LIKE '%.webm' OR url LIKE '%/video/upload/%'";
      } else if (category === "photos") {
        query += " WHERE type = 'image' AND url NOT LIKE '%.mp4' AND url NOT LIKE '%/video/upload/%'";
      } else {
        query += " WHERE category = ?";
        bindings.push(category);
      }
    }

    try {
      query += " ORDER BY created_at DESC, rowid DESC";
    } catch {
      query += " ORDER BY rowid DESC";
    }

    if (limit && !isNaN(Number(limit)) && Number(limit) > 0) {
      query += ` LIMIT ${parseInt(limit, 10)}`;
    }

    let results: any[] = [];
    try {
      const stmt = db.prepare(query);
      const res = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
      results = res.results || [];
    } catch (e) {
      let fallbackQuery = "SELECT * FROM gallery";
      if (category && category !== "all") {
        if (category === "videos") {
          fallbackQuery += " WHERE type = 'video' OR url LIKE '%.mp4' OR url LIKE '%/video/upload/%'";
        } else if (category === "photos") {
          fallbackQuery += " WHERE type = 'image' AND url NOT LIKE '%.mp4' AND url NOT LIKE '%/video/upload/%'";
        } else {
          fallbackQuery += " WHERE category = ?";
        }
      }
      fallbackQuery += " ORDER BY rowid DESC";
      if (limit && !isNaN(Number(limit)) && Number(limit) > 0) {
        fallbackQuery += ` LIMIT ${parseInt(limit, 10)}`;
      }
      const stmt = db.prepare(fallbackQuery);
      const res = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
      results = res.results || [];
    }

    const items = (results || []).map((item: any) => ({
      ...item,
      type:
        item.type ||
        (/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(item.url || "") || (item.url || "").includes("/video/upload/")
          ? "video"
          : "image"),
    }));

    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch gallery items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, url, category, title, type } = body;

    if (!id || !url || !category) {
      return NextResponse.json({ error: "id, url, and category are required" }, { status: 400 });
    }

    const itemType =
      type ||
      (/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(url) || url.includes("/video/upload/")
        ? "video"
        : "image");

    const createdAt = Date.now();
    const db = getDB();

    try {
      await db
        .prepare("INSERT INTO gallery (id, url, category, title, type, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(id, url, category, title || "", itemType, createdAt)
        .run();
    } catch (e) {
      await db.exec("ALTER TABLE gallery ADD COLUMN type TEXT DEFAULT 'image'").catch(() => {});
      await db.exec("ALTER TABLE gallery ADD COLUMN created_at INTEGER DEFAULT 0").catch(() => {});
      await db
        .prepare("INSERT INTO gallery (id, url, category, title, type, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(id, url, category, title || "", itemType, createdAt)
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create gallery item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    const db = getDB();
    await db.prepare("DELETE FROM gallery WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true, message: "Gallery item deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete gallery item" }, { status: 500 });
  }
}
