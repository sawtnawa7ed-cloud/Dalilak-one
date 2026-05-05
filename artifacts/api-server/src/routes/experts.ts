import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserFromRequest } from "./middleware";
import * as crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "dalilak_salt").digest("hex");
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "DAL-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function expertResponse(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    status: u.status, phone: u.phone, accessCode: u.accessCode, createdAt: u.createdAt,
  };
}

/* ── List all experts ── */
router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const experts = await db.select().from(usersTable)
    .where(eq(usersTable.role, "expert"));

  return res.json(experts.map(expertResponse));
});

/* ── Create expert (admin only) ── */
router.post("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const { name, phone, accessCode: providedCode } = req.body;
  if (!name) return res.status(400).json({ error: "اسم الجمعية/الخبير مطلوب" });

  const code = (providedCode || generateCode()).toUpperCase().trim();

  // Check code uniqueness
  const existing = await db.select().from(usersTable).where(eq(usersTable.accessCode, code)).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: "هذا الكود مستخدم مسبقاً، ولّد كوداً جديداً" });

  const internalEmail = `${code.replace("DAL-", "").toLowerCase()}@expert.dalilak.lb`;

  const [expert] = await db.insert(usersTable).values({
    name,
    email: internalEmail,
    passwordHash: hashPassword(code),
    role: "expert",
    status: "approved",
    phone: phone ?? null,
    accessCode: code,
  }).returning();

  return res.status(201).json(expertResponse(expert));
});

/* ── Block expert ── */
router.post("/:id/block", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });

  const [updated] = await db.update(usersTable).set({ status: "rejected" }).where(eq(usersTable.id, id)).returning();
  return res.json(expertResponse(updated));
});

/* ── Unblock expert ── */
router.post("/:id/unblock", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });

  const [updated] = await db.update(usersTable).set({ status: "approved" }).where(eq(usersTable.id, id)).returning();
  return res.json(expertResponse(updated));
});

/* ── Delete expert ── */
router.delete("/:id", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });

  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.status(204).send();
});

export default router;
