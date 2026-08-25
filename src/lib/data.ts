import { getDB } from "@/lib/db";

export interface Product { id: string; name: string | null; image: string; created_at?: number; }
export interface MembershipPlan { id: string; name: string; price: number; billing: string; features: string | string[]; popular: number; badge: string; }
export interface GalleryItem { id: string; url: string; category: string; title: string; type?: string; created_at?: number; }

export async function getProducts(): Promise<Product[]> {
  try {
    const db = getDB();
    try {
      const r = await db.prepare("SELECT * FROM products ORDER BY created_at DESC, rowid DESC").all<Product>();
      return r.results || [];
    } catch {
      const r = await db.prepare("SELECT * FROM products ORDER BY rowid DESC").all<Product>();
      return r.results || [];
    }
  } catch { return []; }
}

export async function getMemberships(): Promise<MembershipPlan[]> {
  try {
    const db = getDB();
    const r = await db.prepare("SELECT * FROM memberships ORDER BY rowid DESC").all<MembershipPlan>();
    return r.results || [];
  } catch { return []; }
}

export async function getGalleryItems(limit = 100): Promise<GalleryItem[]> {
  try {
    const db = getDB();
    try {
      const r = await db.prepare(`SELECT * FROM gallery ORDER BY created_at DESC, rowid DESC LIMIT ${Math.floor(limit)}`).all<GalleryItem>();
      const items = (r.results || []).map((i: GalleryItem) => ({
        ...i,
        type: i.type || (/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(i.url || "") || (i.url || "").includes("/video/upload/") ? "video" : "image"),
      }));
      return items;
    } catch {
      const r = await db.prepare(`SELECT * FROM gallery ORDER BY rowid DESC LIMIT ${Math.floor(limit)}`).all<GalleryItem>();
      return (r.results || []).map((i: GalleryItem) => ({
        ...i,
        type: i.type || (/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(i.url || "") || (i.url || "").includes("/video/upload/") ? "video" : "image"),
      }));
    }
  } catch { return []; }
}
