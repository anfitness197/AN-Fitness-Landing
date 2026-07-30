import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { apiError, unauthorizedError, validationError } from "@/lib/api-errors";
import { jsonCached } from "@/lib/http-cache";

export const runtime = "edge";

const SETTINGS_KEY = "media_banner";

export interface MediaBannerConfig {
  id: string;
  active: 0 | 1;
  mediaUrl: string;
  mediaType: "video" | "audio";
  width?: number;
  height?: number;
  expiresAt: string | null;
  updatedAt: string;
}

async function checkAuth() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const ts = Date.parse(expiresAt);
  if (Number.isNaN(ts)) return false;
  return ts <= Date.now();
}

function parseStored(value: string): MediaBannerConfig | null {
  try {
    const data = JSON.parse(value);
    if (!data || typeof data !== "object") return null;
    return data as MediaBannerConfig;
  } catch {
    return null;
  }
}

async function loadBanner(): Promise<MediaBannerConfig | null> {
  const db = getDB();
  const result = await db
    .prepare("SELECT * FROM settings WHERE key = ?")
    .bind(SETTINGS_KEY)
    .first<{ key: string; value: string }>();

  if (!result?.value) return null;
  return parseStored(result.value);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const admin = url.searchParams.get("admin") === "1";

    if (admin) {
      if (!(await checkAuth())) {
        return unauthorizedError();
      }
      const banner = await loadBanner();
      if (!banner) {
        return NextResponse.json({
          id: "",
          active: 0,
          mediaUrl: "",
          mediaType: "video",
          expiresAt: null,
          updatedAt: "",
        });
      }
      return NextResponse.json(banner);
    }

    const banner = await loadBanner();
    if (
      !banner ||
      banner.active !== 1 ||
      !banner.mediaUrl ||
      isExpired(banner.expiresAt)
    ) {
      return jsonCached({ active: 0 }, 30);
    }

    return jsonCached(
      {
        id: banner.id,
        active: 1,
        mediaUrl: banner.mediaUrl,
        mediaType: banner.mediaType === "audio" ? "audio" : "video",
        width: banner.width,
        height: banner.height,
        expiresAt: banner.expiresAt,
      },
      30
    );
  } catch (err) {
    return apiError(err, 500, "Couldn't load media banner. Please try again.");
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const body = await request.json();
    const {
      mediaUrl,
      mediaType,
      active,
      expiresAt,
      width,
      height,
    } = body;

    const wantActive = !!active;
    const url = typeof mediaUrl === "string" ? mediaUrl.trim() : "";

    if (wantActive && !url) {
      return validationError("Please upload a video or audio file before activating the banner.");
    }

    const type: "video" | "audio" =
      mediaType === "audio" || /\.(mp3|wav|m4a|aac|ogg)(\?.*)?$/i.test(url)
        ? "audio"
        : "video";

    let expires: string | null = null;
    if (expiresAt) {
      const parsed = Date.parse(expiresAt);
      if (Number.isNaN(parsed)) {
        return validationError("Please enter a valid expiration date.");
      }
      expires = new Date(parsed).toISOString();
    }

    const existing = await loadBanner();
    const mediaChanged = !existing || existing.mediaUrl !== url;
    const id =
      url && mediaChanged
        ? crypto.randomUUID()
        : existing?.id || (url ? crypto.randomUUID() : "");

    const payload: MediaBannerConfig = {
      id,
      active: wantActive ? 1 : 0,
      mediaUrl: url,
      mediaType: type,
      width: typeof width === "number" ? width : existing?.width,
      height: typeof height === "number" ? height : existing?.height,
      expiresAt: expires,
      updatedAt: new Date().toISOString(),
    };

    const db = getDB();
    await db
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .bind(SETTINGS_KEY, JSON.stringify(payload))
      .run();

    return NextResponse.json({ success: true, banner: payload });
  } catch (err) {
    return apiError(err, 500, "Couldn't save media banner. Please try again.");
  }
}

export async function DELETE() {
  if (!(await checkAuth())) {
    return unauthorizedError();
  }

  try {
    const existing = await loadBanner();
    const cleared: MediaBannerConfig = {
      id: existing?.id || "",
      active: 0,
      mediaUrl: "",
      mediaType: existing?.mediaType === "audio" ? "audio" : "video",
      expiresAt: null,
      updatedAt: new Date().toISOString(),
    };

    const db = getDB();
    await db
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .bind(SETTINGS_KEY, JSON.stringify(cleared))
      .run();

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, 500, "Couldn't clear media banner. Please try again.");
  }
}
