import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifySession, hashPassword, comparePassword } from "@/lib/auth";
import { apiError, unauthorizedError, validationError, notFoundError } from "@/lib/api-errors";

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
    return unauthorizedError();
  }

  const session = await verifySession(token);
  if (!session) {
    return unauthorizedError();
  }

  try {
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return validationError("Please enter your current and new password.");
    }

    if (newPassword.length < 6) {
      return validationError("New password must be at least 6 characters.");
    }

    const db = getDB();
    const user = await db
      .prepare("SELECT * FROM admin_users WHERE username = ?")
      .bind(session.username)
      .first<{ username: string; passwordHash: string }>();

    if (!user) {
      return notFoundError("Account not found.");
    }

    const isValid = await comparePassword(oldPassword, user.passwordHash);
    if (!isValid) {
      return validationError("Current password is incorrect.");
    }

    const newHash = await hashPassword(newPassword);
    await db
      .prepare("UPDATE admin_users SET passwordHash = ? WHERE username = ?")
      .bind(newHash, session.username)
      .run();

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    return apiError(err, 500, "Couldn't update password. Please try again.");
  }
}
