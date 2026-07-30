import { NextResponse } from "next/server";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const UNAUTH_ERROR = "Please sign in to continue.";

export function apiError(
  err: unknown,
  status = 500,
  fallback: string = GENERIC_ERROR
) {
  console.error(err);
  return NextResponse.json({ error: fallback, code: "INTERNAL" }, { status });
}

export function unauthorizedError() {
  return NextResponse.json({ error: UNAUTH_ERROR, code: "UNAUTHORIZED" }, { status: 401 });
}

export function validationError(message: string) {
  return NextResponse.json({ error: message, code: "VALIDATION" }, { status: 400 });
}

export function notFoundError(message = "Not found.") {
  return NextResponse.json({ error: message, code: "NOT_FOUND" }, { status: 404 });
}
