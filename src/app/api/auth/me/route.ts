import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession, hashPassword, comparePassword } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  const token = cookies().get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, username: session.username });
}

export async function POST(request: Request) {
  const token = cookies().get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new passwords are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
    }

    const db = getDB();
    const user = await db
      .prepare("SELECT * FROM admin_users WHERE username = ?")
      .bind(session.username)
      .first<{ username: string; passwordHash: string }>();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await comparePassword(oldPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await db
      .prepare("UPDATE admin_users SET passwordHash = ? WHERE username = ?")
      .bind(newHash, session.username)
      .run();

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update password" }, { status: 500 });
  }
}
