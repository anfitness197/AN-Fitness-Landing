import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "an-fitness-default-jwt-secret-key-change-this-in-prod"
);

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/an-admin") && path !== "/an-admin/login") {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/an-admin/login", request.url)));
    }

    try {
      await jwtVerify(token, SECRET);
      return applySecurityHeaders(NextResponse.next());
    } catch (err) {
      const response = NextResponse.redirect(new URL("/an-admin/login", request.url));
      response.cookies.delete("auth-token");
      return applySecurityHeaders(response);
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/an-admin/:path*"],
};
