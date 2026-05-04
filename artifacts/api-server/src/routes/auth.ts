import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "dalilak_salt").digest("hex");
}

function generateToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}:dalilak`).toString("base64");
}

router.post("/register", async (req, res) => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

  const { name, email, password, role, phone } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: "البريد الإلكتروني مستخدم مسبقاً" });

  const status = role === "expert" ? "pending" : "active";

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: hashPassword(password),
    role: role as "visitor" | "expert",
    status: status as "pending" | "active",
    phone: phone ?? null,
  }).returning();

  const token = generateToken(user.id);
  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt },
  });
});

router.post("/login", async (req, res) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "البريد أو كلمة المرور غير صحيحة" });
  }

  if (user.role === "expert" && user.status === "pending") {
    return res.status(403).json({ error: "حسابك قيد المراجعة من قبل المدير" });
  }
  if (user.role === "expert" && user.status === "rejected") {
    return res.status(403).json({ error: "تم رفض طلبك من قبل المدير" });
  }

  const token = generateToken(user.id);
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt },
  });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "غير مصرح" });

  try {
    const decoded = Buffer.from(authHeader.replace("Bearer ", ""), "base64").toString();
    const userId = parseInt(decoded.split(":")[0]);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(401).json({ error: "غير مصرح" });
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt });
  } catch {
    return res.status(401).json({ error: "غير مصرح" });
  }
});

export default router;
