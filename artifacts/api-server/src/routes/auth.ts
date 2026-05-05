import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";
import { getUserFromRequest } from "./middleware";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "dalilak_salt").digest("hex");
}

function generateToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}:dalilak`).toString("base64");
}

function userOut(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt };
}

/* ── Admin login: email + password ── */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "أدخل البريد وكلمة المرور" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password))
    return res.status(401).json({ error: "البريد أو كلمة المرور غير صحيحة" });
  if (user.role !== "admin")
    return res.status(403).json({ error: "هذا المسار خاص بالمدير فقط" });

  return res.json({ token: generateToken(user.id), user: userOut(user) });
});

/* ── Expert login: username (accessCode) + password ── */
router.post("/expert-login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "أدخل اسم المستخدم وكلمة المرور" });

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.accessCode, String(username).toUpperCase().trim()))
    .limit(1);

  if (!user || user.passwordHash !== hashPassword(password))
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  if (user.status === "rejected")
    return res.status(403).json({ error: "هذا الحساب موقوف — تواصل مع المدير" });

  return res.json({ token: generateToken(user.id), user: userOut(user) });
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
  const updates: Record<string, any> = {};

  if (name?.trim()) updates.name = name.trim();

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: "أدخل كلمة المرور الحالية" });
    if (user.passwordHash !== hashPassword(currentPassword))
      return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
    if (newPassword.length < 6) return res.status(400).json({ error: "كلمة المرور 6 أحرف على الأقل" });
    updates.passwordHash = hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "لا توجد تغييرات" });

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
  return res.json(userOut(updated));
});

export default router;
