import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  // Clear the auth-token cookie by setting maxAge to 0/deleting it
  response.cookies.delete("auth-token");
  return response;
}
