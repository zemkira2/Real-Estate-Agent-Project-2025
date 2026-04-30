import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);

const COOKIE_NAME = "auth-token";
const USER_STORE_PATH = path.join(process.cwd(), "data", "users.json");

export interface UserPreferences {
  purpose: "live" | "invest" | "any";
  budgetMin: number;
  budgetMax: number;
  propertyType: string;
  minBedrooms: number;
  suburbs: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: UserPreferences;
}

interface StoredUser extends User {
  passwordHash: string;
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitiseName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

async function ensureUserStore(): Promise<void> {
  await fs.mkdir(path.dirname(USER_STORE_PATH), { recursive: true });
  try {
    await fs.access(USER_STORE_PATH);
  } catch {
    await fs.writeFile(USER_STORE_PATH, "[]", "utf-8");
  }
}

function isStoredUser(value: unknown): value is StoredUser {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<StoredUser>;
  return (
    typeof c.id === "string" &&
    typeof c.email === "string" &&
    typeof c.name === "string" &&
    typeof c.passwordHash === "string"
  );
}

async function readStoredUsers(): Promise<StoredUser[]> {
  await ensureUserStore();
  try {
    const raw = await fs.readFile(USER_STORE_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredUser);
  } catch {
    return [];
  }
}

async function writeStoredUsers(users: StoredUser[]): Promise<void> {
  await ensureUserStore();
  await fs.writeFile(USER_STORE_PATH, JSON.stringify(users, null, 2), "utf-8");
}

export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const normalisedEmail = normaliseEmail(email);
  const cleanedName = sanitiseName(name);
  const users = await readStoredUsers();

  if (users.some((u) => u.email === normalisedEmail)) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  const user: StoredUser = { id, email: normalisedEmail, name: cleanedName, passwordHash };

  users.push(user);
  await writeStoredUsers(users);
  return { id, email: user.email, name: user.name };
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<User> {
  const normalisedEmail = normaliseEmail(email);
  const users = await readStoredUsers();
  const stored = users.find((u) => u.email === normalisedEmail);

  if (!stored) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(password, stored.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  return { id: stored.id, email: stored.email, name: stored.name, preferences: stored.preferences };
}

export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<void> {
  const users = await readStoredUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  users[idx] = { ...users[idx], preferences };
  await writeStoredUsers(users);
}

export async function createToken(user: User): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ id: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { id: payload.sub as string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Look up full user (including preferences) from storage
  const users = await readStoredUsers();
  const stored = users.find((u) => u.id === payload.id);
  if (!stored) return null;

  return { id: stored.id, email: stored.email, name: stored.name, preferences: stored.preferences };
}

export function getTokenCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
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
