import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { getUserFromRequest } from "./middleware";

const router = Router();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);
const JWT_EXPIRY = "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function legacyHash(password: string): string {
  return crypto.createHash("sha256").update(password + "dalilak_salt").digest("hex");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith("$2")) {
    return bcrypt.compare(password, hash);
  }
  return hash === legacyHash(password);
}

async function migratePasswordIfNeeded(userId: number, password: string, hash: string): Promise<void> {
  if (!hash.startsWith("$2")) {
    const newHash = await hashPassword(password);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));
  }
}

export async function generateToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = parseInt(String(payload.sub));
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

function userOut(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt };
}

/* ── Admin login: email + password ── */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "أدخل البريد وكلمة المرور" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return res.status(401).json({ error: "البريد أو كلمة المرور غير صحيحة" });
  if (user.role !== "admin")
    return res.status(403).json({ error: "هذا المسار خاص بالمدير فقط" });

  await migratePasswordIfNeeded(user.id, password, user.passwordHash);
  return res.json({ token: await generateToken(user.id), user: userOut(user) });
});

/* ── Expert login: username (accessCode) + password ── */
router.post("/expert-login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "أدخل اسم المستخدم وكلمة المرور" });

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.accessCode, String(username).toUpperCase().trim()))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  if (user.status === "rejected")
    return res.status(403).json({ error: "هذا الحساب موقوف — تواصل مع المدير" });

  await migratePasswordIfNeeded(user.id, password, user.passwordHash);
  return res.json({ token: await generateToken(user.id), user: userOut(user) });
});

/* ── Get current user ── */
router.get("/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "غير مصرح" });
  return res.json(userOut(user));
});

/* ── Update admin profile ── */
router.put("/profile", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "غير مصرح" });

  const { name, currentPassword, newPassword } = req.body;
  const updates: Record<string, unknown> = {};

  if (name?.trim()) updates.name = name.trim();

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: "أدخل كلمة المرور الحالية" });
    if (!(await verifyPassword(currentPassword, user.passwordHash)))
      return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
    if (newPassword.length < 6) return res.status(400).json({ error: "كلمة المرور 6 أحرف على الأقل" });
    updates.passwordHash = await hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "لا توجد تغييرات" });

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
  return res.json(userOut(updated));
});

export default router;
