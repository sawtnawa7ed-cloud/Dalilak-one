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

function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id, name: user.name, email: user.email,
    role: user.role, status: user.status, createdAt: user.createdAt,
  };
}

/* ── Email + Password login (admin & visitor) ── */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "أدخل البريد وكلمة المرور" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "البريد أو كلمة المرور غير صحيحة" });
  }
  if (user.role === "expert" && user.status === "rejected") {
    return res.status(403).json({ error: "هذا الحساب موقوف، تواصل مع المدير" });
  }

  return res.json({ token: generateToken(user.id), user: userResponse(user) });
});

/* ── Access Code login (experts / associations) ── */
router.post("/code-login", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "أدخل الكود" });

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.accessCode, String(code).toUpperCase().trim()))
    .limit(1);

  if (!user) return res.status(401).json({ error: "الكود غير صحيح" });
  if (user.status === "rejected") return res.status(403).json({ error: "هذا الحساب موقوف، تواصل مع المدير" });

  return res.json({ token: generateToken(user.id), user: userResponse(user) });
});

/* ── Visitor self-registration ── */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "جميع الحقول مطلوبة" });

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: "البريد الإلكتروني مستخدم مسبقاً" });

  const [user] = await db.insert(usersTable).values({
    name, email, passwordHash: hashPassword(password), role: "visitor", status: "active",
  }).returning();

  return res.status(201).json({ token: generateToken(user.id), user: userResponse(user) });
});

/* ── Get current user ── */
router.get("/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "غير مصرح" });
  return res.json(userResponse(user));
});

/* ── Update profile (admin or any logged-in user) ── */
router.put("/profile", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "غير مصرح" });

  const { name, currentPassword, newPassword } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (name && name.trim()) updates.name = name.trim();

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: "أدخل كلمة المرور الحالية" });
    if (user.passwordHash !== hashPassword(currentPassword)) {
      return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
    }
    if (newPassword.length < 6) return res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
    updates.passwordHash = hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "لا توجد تغييرات" });

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
  return res.json(userResponse(updated));
});

export default router;
