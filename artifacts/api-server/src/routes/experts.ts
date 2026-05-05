import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListExpertsQueryParams, ApproveExpertParams, RejectExpertParams } from "@workspace/api-zod";
import { getUserFromRequest } from "./middleware";
import * as crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "dalilak_salt").digest("hex");
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pass = "EXP-";
  for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

function generateToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}:dalilak`).toString("base64");
}

router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const parsed = ListExpertsQueryParams.safeParse(req.query);
  let experts;

  if (parsed.success && parsed.data.status) {
    experts = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, status: usersTable.status, phone: usersTable.phone, createdAt: usersTable.createdAt,
    }).from(usersTable).where(and(eq(usersTable.role, "expert"), eq(usersTable.status, parsed.data.status as any)));
  } else {
    experts = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, status: usersTable.status, phone: usersTable.phone, createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.role, "expert"));
  }

  return res.json(experts);
});

router.post("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const { name, email, phone } = req.body;
  if (!name || !email) return res.status(400).json({ error: "الاسم والبريد مطلوبان" });

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: "البريد الإلكتروني مستخدم مسبقاً" });

  const generatedPassword = generatePassword();

  const [expert] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: hashPassword(generatedPassword),
    role: "expert",
    status: "approved",
    phone: phone ?? null,
  }).returning();

  return res.status(201).json({
    id: expert.id, name: expert.name, email: expert.email,
    role: expert.role, status: expert.status, createdAt: expert.createdAt,
    generatedPassword,
  });
});

router.post("/:id/approve", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const parsed = ApproveExpertParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "معرف غير صحيح" });

  const [updated] = await db.update(usersTable)
    .set({ status: "approved" })
    .where(eq(usersTable.id, parsed.data.id))
    .returning();

  return res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, status: updated.status, createdAt: updated.createdAt });
});

router.post("/:id/reject", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const parsed = RejectExpertParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "معرف غير صحيح" });

  const [updated] = await db.update(usersTable)
    .set({ status: "rejected" })
    .where(eq(usersTable.id, parsed.data.id))
    .returning();

  return res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, status: updated.status, createdAt: updated.createdAt });
});

router.post("/:id/block", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });

  const [updated] = await db.update(usersTable)
    .set({ status: "rejected" })
    .where(eq(usersTable.id, id))
    .returning();

  return res.json({ id: updated.id, name: updated.name, status: updated.status });
});

router.post("/:id/unblock", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });

  const [updated] = await db.update(usersTable)
    .set({ status: "approved" })
    .where(eq(usersTable.id, id))
    .returning();

  return res.json({ id: updated.id, name: updated.name, status: updated.status });
});

router.delete("/:id", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });

  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.status(204).send();
});

export default router;
