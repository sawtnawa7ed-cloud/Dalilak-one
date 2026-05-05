import { Router } from "express";
import { db } from "@workspace/db";
import { placesTable, usersTable, evaluationsTable, governoratesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const [placesCount] = await db.select({ count: count() }).from(placesTable);
  const [expertsCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "expert"));
  const [evalsCount] = await db.select({ count: count() }).from(evaluationsTable);
  const [govCount] = await db.select({ count: count() }).from(governoratesTable);

  const recentPlaces = await db
    .select({
      id: placesTable.id, name: placesTable.name, category: placesTable.category,
      address: placesTable.address, lat: placesTable.lat, lng: placesTable.lng,
      phone: placesTable.phone, governorateId: placesTable.governorateId,
      cityId: placesTable.cityId, areaId: placesTable.areaId, isVerified: placesTable.isVerified,
      hasRamp: placesTable.hasRamp, hasElevator: placesTable.hasElevator,
      hasAccessibleBathroom: placesTable.hasAccessibleBathroom,
      hasWideSpace: placesTable.hasWideSpace, hasGoodStaff: placesTable.hasGoodStaff,
      hasIndoorSigns: placesTable.hasIndoorSigns,
      coverPhoto: placesTable.coverPhoto, createdAt: placesTable.createdAt,
      governorateName: governoratesTable.name,
    })
    .from(placesTable)
    .leftJoin(governoratesTable, eq(placesTable.governorateId, governoratesTable.id))
    .orderBy(placesTable.createdAt)
    .limit(6);

  return res.json({
    totalPlaces: placesCount.count,
    totalExperts: expertsCount.count,
    totalEvaluations: evalsCount.count,
    totalGovernorates: govCount.count,
    recentPlaces,
  });
});

export default router;
