import { NextResponse } from "next/server";

export function publicCacheHeaders(seconds = 60) {
  return {
    "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 5}`,
  };
}

export function jsonCached(data: unknown, seconds = 60, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...publicCacheHeaders(seconds),
      ...(init?.headers || {}),
    },
  });
}
