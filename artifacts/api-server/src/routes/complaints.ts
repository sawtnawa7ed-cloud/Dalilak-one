import { Router } from "express";
import { db } from "@workspace/db";
import { complaintsTable, placesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserFromRequest } from "./middleware";

const router = Router();

router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const complaints = await db
    .select({
      id: complaintsTable.id, placeId: complaintsTable.placeId,
      message: complaintsTable.message, senderName: complaintsTable.senderName,
      senderEmail: complaintsTable.senderEmail, senderPhone: complaintsTable.senderPhone,
      status: complaintsTable.status, createdAt: complaintsTable.createdAt,
      placeName: placesTable.name,
    })
    .from(complaintsTable)
    .leftJoin(placesTable, eq(complaintsTable.placeId, placesTable.id))
    .orderBy(complaintsTable.createdAt);

  return res.json(complaints);
});

router.post("/", async (req, res) => {
  const { senderName, senderEmail, senderPhone, message, placeId } = req.body;
  if (!senderName || !senderEmail || !senderPhone || !message)
    return res.status(400).json({ error: "جميع الحقول مطلوبة بما فيها رقم الهاتف" });

  const [complaint] = await db.insert(complaintsTable).values({
    placeId: placeId ?? null,
    message,
    senderName,
    senderEmail,
    senderPhone,
  }).returning();

  return res.status(201).json({ ...complaint, placeName: null });
});

router.put("/:id/resolve", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });

  const [updated] = await db.update(complaintsTable)
    .set({ status: "resolved" })
    .where(eq(complaintsTable.id, id))
    .returning();

  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صحيح" });

  await db.delete(complaintsTable).where(eq(complaintsTable.id, id));
  return res.status(204).send();
});

export default router;
