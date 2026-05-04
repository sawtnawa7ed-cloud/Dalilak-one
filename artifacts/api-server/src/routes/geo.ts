import { Router } from "express";
import { db } from "@workspace/db";
import { governoratesTable, citiesTable, areasTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListCitiesQueryParams, ListAreasQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/governorates", async (_req, res) => {
  const rows = await db.select().from(governoratesTable).orderBy(governoratesTable.name);
  return res.json(rows);
});

router.get("/cities", async (req, res) => {
  const parsed = ListCitiesQueryParams.safeParse(req.query);
  let q = db.select().from(citiesTable).orderBy(citiesTable.name);
  if (parsed.success && parsed.data.governorateId) {
    const rows = await db.select().from(citiesTable)
      .where(eq(citiesTable.governorateId, parsed.data.governorateId))
      .orderBy(citiesTable.name);
    return res.json(rows);
  }
  return res.json(await q);
});

router.get("/areas", async (req, res) => {
  const parsed = ListAreasQueryParams.safeParse(req.query);
  if (parsed.success && parsed.data.cityId) {
    const rows = await db.select().from(areasTable)
      .where(eq(areasTable.cityId, parsed.data.cityId))
      .orderBy(areasTable.name);
    return res.json(rows);
  }
  const rows = await db.select().from(areasTable).orderBy(areasTable.name);
  return res.json(rows);
});

export default router;
