import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListExpertsQueryParams, ApproveExpertParams, RejectExpertParams } from "@workspace/api-zod";
import { getUserFromRequest } from "./middleware";

const router = Router();

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

export default router;
