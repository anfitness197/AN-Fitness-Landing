import { hashSync, compareSync } from "bcrypt-edge";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "an-fitness-default-jwt-secret-key-change-this-in-prod"
);

export async function hashPassword(password: string): Promise<string> {
  return hashSync(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compareSync(password, hash);
}

export async function createSession(username: string, rememberMe: boolean = false): Promise<string> {
  const expiration = rememberMe ? "30d" : "24h";
  return await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<{ username: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { username: string };
  } catch (err) {
    return null;
  }
}
