import { Router } from "express";
import { db } from "@workspace/db";
import { complaintsTable, placesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SubmitComplaintBody } from "@workspace/api-zod";
import { getUserFromRequest } from "./middleware";

const router = Router();

router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });

  const complaints = await db
    .select({
      id: complaintsTable.id, placeId: complaintsTable.placeId,
      message: complaintsTable.message, senderName: complaintsTable.senderName,
      senderEmail: complaintsTable.senderEmail, status: complaintsTable.status,
      createdAt: complaintsTable.createdAt, placeName: placesTable.name,
    })
    .from(complaintsTable)
    .leftJoin(placesTable, eq(complaintsTable.placeId, placesTable.id))
    .orderBy(complaintsTable.createdAt);

  return res.json(complaints);
});

router.post("/", async (req, res) => {
  const parsed = SubmitComplaintBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

  const [complaint] = await db.insert(complaintsTable).values({
    placeId: parsed.data.placeId ?? null,
    message: parsed.data.message,
    senderName: parsed.data.senderName,
    senderEmail: parsed.data.senderEmail,
  }).returning();

  return res.status(201).json({ ...complaint, placeName: null });
});

export default router;
