import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  response.cookies.delete("auth-token");
  return response;
}
