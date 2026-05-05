import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, evaluationsTable, photosTable, placesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUserFromRequest } from "./middleware";
import * as crypto from "crypto";

const router = Router();

function hashPassword(p: string) {
  return crypto.createHash("sha256").update(p + "dalilak_salt").digest("hex");
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function rand(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export function generateUsername() { return `EXP-${rand(6)}`; }
export function generatePassword() { return `${rand(4)}-${rand(4)}`; }

function expertOut(u: typeof usersTable.$inferSelect & { generatedPassword?: string }) {
  return {
    id: u.id, name: u.name, role: u.role, status: u.status,
    phone: u.phone, accessCode: u.accessCode, createdAt: u.createdAt,
    generatedPassword: u.generatedPassword,
  };
}

/* ── List all experts ── */
router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const experts = await db.select().from(usersTable).where(eq(usersTable.role, "expert"));
  return res.json(experts.map(e => expertOut(e)));
});

/* ── Create expert (admin only) ── */
router.post("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const { name, phone, username: providedUsername, password: providedPassword } = req.body;
  if (!name) return res.status(400).json({ error: "اسم الجمعية أو الخبير مطلوب" });

  const username = (providedUsername || generateUsername()).toUpperCase().trim();
  const password = providedPassword || generatePassword();

  const existing = await db.select().from(usersTable).where(eq(usersTable.accessCode, username)).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: "اسم المستخدم مستخدم، ولّد جديداً" });

  const internalEmail = `${username.toLowerCase().replace("-", "")}@expert.dalilak.lb`;

  const [expert] = await db.insert(usersTable).values({
    name,
    email: internalEmail,
    passwordHash: hashPassword(password),
    role: "expert",
    status: "approved",
    phone: phone ?? null,
    accessCode: username,
  }).returning();

  return res.status(201).json(expertOut({ ...expert, generatedPassword: password }));
});

/* ── Block ── */
router.post("/:id/block", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });
  const [u] = await db.update(usersTable).set({ status: "rejected" }).where(eq(usersTable.id, id)).returning();
  return res.json(expertOut(u));
});

/* ── Unblock ── */
router.post("/:id/unblock", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });
  const [u] = await db.update(usersTable).set({ status: "approved" }).where(eq(usersTable.id, id)).returning();
  return res.json(expertOut(u));
});

/* ── Delete ── */
router.delete("/:id", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });
  // Clear FK references before deleting the user
  await db.delete(evaluationsTable).where(eq(evaluationsTable.expertId, id));
  await db.execute(sql`UPDATE ${photosTable} SET uploaded_by_id = NULL WHERE uploaded_by_id = ${id}`);
  await db.execute(sql`UPDATE ${placesTable} SET added_by_id = NULL WHERE added_by_id = ${id}`);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.status(204).send();
});

export default router;
