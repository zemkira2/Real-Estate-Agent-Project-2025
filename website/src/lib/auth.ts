import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);

const COOKIE_NAME = "auth-token";

export interface User {
  id: string;
  email: string;
  name: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

// In-memory user store for development.
// For production, replace with a database (Supabase, Vercel Postgres, etc.)
const users: Map<string, StoredUser> = new Map();

export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  if (users.has(email)) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  const user: StoredUser = { id, email, name, passwordHash };
  users.set(email, user);

  return { id, email, name };
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<User> {
  const user = users.get(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  return { id: user.id, email: user.email, name: user.name };
}

export async function createToken(user: User): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getTokenCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  };
}

export function getLogoutCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  };
}
