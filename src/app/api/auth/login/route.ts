import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { comparePassword, createSession } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { username, password, rememberMe } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const db = getDB();
    const user = await db
      .prepare("SELECT * FROM admin_users WHERE username = ?")
      .bind(username)
      .first<{ username: string; passwordHash: string }>();

    if (!user) {
      // Avoid leaking whether username or password was incorrect, but keep it clear for admin
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSession(user.username, !!rememberMe);
    const response = NextResponse.json({ success: true, user: { username: user.username } });

    // Store JWT in an httpOnly secure cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 86400, // 30 days or 1 day
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}
