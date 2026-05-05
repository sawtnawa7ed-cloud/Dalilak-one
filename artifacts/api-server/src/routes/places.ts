import { Router } from "express";
import { db } from "@workspace/db";
import {
  placesTable, photosTable, evaluationsTable,
  governoratesTable, citiesTable, areasTable, usersTable
} from "@workspace/db";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import {
  ListPlacesQueryParams, CreatePlaceBody,
  GetPlaceParams, UpdatePlaceParams, UpdatePlaceBody,
  DeletePlaceParams, UploadPlacePhotoParams, UploadPlacePhotoBody,
  SubmitEvaluationParams, SubmitEvaluationBody
} from "@workspace/api-zod";
import { getUserFromRequest } from "./middleware";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListPlacesQueryParams.safeParse(req.query);
  const filters: ReturnType<typeof and>[] = [];

  if (parsed.success) {
    const p = parsed.data;
    if (p.governorateId) filters.push(eq(placesTable.governorateId, p.governorateId));
    if (p.cityId) filters.push(eq(placesTable.cityId, p.cityId));
    if (p.areaId) filters.push(eq(placesTable.areaId, p.areaId));
    if (p.category) filters.push(eq(placesTable.category, p.category));
    if (p.search) filters.push(
      or(ilike(placesTable.name, `%${p.search}%`), ilike(placesTable.address, `%${p.search}%`))
    );
  }

  const places = await db
    .select({
      id: placesTable.id,
      name: placesTable.name,
      category: placesTable.category,
      address: placesTable.address,
      lat: placesTable.lat,
      lng: placesTable.lng,
      phone: placesTable.phone,
      governorateId: placesTable.governorateId,
      cityId: placesTable.cityId,
      areaId: placesTable.areaId,
      isVerified: placesTable.isVerified,
      hasRamp: placesTable.hasRamp,
      hasElevator: placesTable.hasElevator,
      hasAccessibleBathroom: placesTable.hasAccessibleBathroom,
      hasWideSpace: placesTable.hasWideSpace,
      hasGoodStaff: placesTable.hasGoodStaff,
      hasIndoorSigns: placesTable.hasIndoorSigns,
      coverPhoto: placesTable.coverPhoto,
      createdAt: placesTable.createdAt,
      governorateName: governoratesTable.name,
      cityName: citiesTable.name,
    })
    .from(placesTable)
    .leftJoin(governoratesTable, eq(placesTable.governorateId, governoratesTable.id))
    .leftJoin(citiesTable, eq(placesTable.cityId, citiesTable.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(placesTable.createdAt);

  const withRatings = await Promise.all(places.map(async (p) => {
    const evals = await db.select({ rating: evaluationsTable.rating })
      .from(evaluationsTable).where(eq(evaluationsTable.placeId, p.id));
    const avgRating = evals.length ? evals.reduce((s, e) => s + e.rating, 0) / evals.length : 0;
    return { ...p, avgRating: Math.round(avgRating * 10) / 10, reviewCount: evals.length, areaName: null };
  }));

  return res.json(withRatings);
});

router.post("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || (user.role !== "expert" && user.role !== "admin")) {
    return res.status(403).json({ error: "صلاحية الخبراء فقط" });
  }

  const parsed = CreatePlaceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

  const [place] = await db.insert(placesTable).values({
    ...parsed.data,
    addedById: user.id,
    areaId: parsed.data.areaId ?? null,
  }).returning();

  return res.status(201).json({ ...place, governorateName: null, cityName: null, areaName: null, avgRating: 0, reviewCount: 0 });
});

router.get("/:id", async (req, res) => {
  const parsed = GetPlaceParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "معرف غير صحيح" });

  const [place] = await db
    .select({
      id: placesTable.id, name: placesTable.name, category: placesTable.category,
      address: placesTable.address, lat: placesTable.lat, lng: placesTable.lng,
      phone: placesTable.phone, description: placesTable.description,
      governorateId: placesTable.governorateId, cityId: placesTable.cityId, areaId: placesTable.areaId,
      isVerified: placesTable.isVerified, hasRamp: placesTable.hasRamp, hasElevator: placesTable.hasElevator,
      hasAccessibleBathroom: placesTable.hasAccessibleBathroom,
      hasWideSpace: placesTable.hasWideSpace, hasGoodStaff: placesTable.hasGoodStaff,
      hasIndoorSigns: placesTable.hasIndoorSigns,
      coverPhoto: placesTable.coverPhoto, createdAt: placesTable.createdAt,
      governorateName: governoratesTable.name, cityName: citiesTable.name,
    })
    .from(placesTable)
    .leftJoin(governoratesTable, eq(placesTable.governorateId, governoratesTable.id))
    .leftJoin(citiesTable, eq(placesTable.cityId, citiesTable.id))
    .where(eq(placesTable.id, parsed.data.id))
    .limit(1);

  if (!place) return res.status(404).json({ error: "المكان غير موجود" });

  const photos = await db.select({
    id: photosTable.id, placeId: photosTable.placeId, url: photosTable.url,
    caption: photosTable.caption, createdAt: photosTable.createdAt,
    uploadedByName: usersTable.name,
  })
    .from(photosTable)
    .leftJoin(usersTable, eq(photosTable.uploadedById, usersTable.id))
    .where(eq(photosTable.placeId, parsed.data.id));

  const evaluations = await db.select({
    id: evaluationsTable.id, placeId: evaluationsTable.placeId, expertId: evaluationsTable.expertId,
    hasRamp: evaluationsTable.hasRamp, hasElevator: evaluationsTable.hasElevator,
    hasAccessibleBathroom: evaluationsTable.hasAccessibleBathroom,
    hasWideSpace: evaluationsTable.hasWideSpace, hasGoodStaff: evaluationsTable.hasGoodStaff,
    hasIndoorSigns: evaluationsTable.hasIndoorSigns, notes: evaluationsTable.notes,
    rating: evaluationsTable.rating, createdAt: evaluationsTable.createdAt,
    expertName: usersTable.name,
  })
    .from(evaluationsTable)
    .leftJoin(usersTable, eq(evaluationsTable.expertId, usersTable.id))
    .where(eq(evaluationsTable.placeId, parsed.data.id));

  const avgRating = evaluations.length ? evaluations.reduce((s, e) => s + e.rating, 0) / evaluations.length : 0;

  return res.json({
    ...place, areaName: null,
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount: evaluations.length,
    photos, evaluations,
  });
});

router.put("/:id", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || (user.role !== "expert" && user.role !== "admin")) {
    return res.status(403).json({ error: "صلاحية الخبراء فقط" });
  }
  const paramsParsed = UpdatePlaceParams.safeParse(req.params);
  const bodyParsed = UpdatePlaceBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

  const [updated] = await db.update(placesTable).set(bodyParsed.data).where(eq(placesTable.id, paramsParsed.data.id)).returning();
  return res.json({ ...updated, governorateName: null, cityName: null, areaName: null, avgRating: 0, reviewCount: 0 });
});

router.delete("/:id", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "صلاحية المدير فقط" });
  const parsed = DeletePlaceParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "معرف غير صحيح" });
  await db.delete(placesTable).where(eq(placesTable.id, parsed.data.id));
  return res.status(204).send();
});

router.post("/:id/photos", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || (user.role !== "expert" && user.role !== "admin")) {
    return res.status(403).json({ error: "صلاحية الخبراء فقط" });
  }
  const paramsParsed = UploadPlacePhotoParams.safeParse(req.params);
  const bodyParsed = UploadPlacePhotoBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

  const [photo] = await db.insert(photosTable).values({
    placeId: paramsParsed.data.id,
    url: bodyParsed.data.url,
    caption: bodyParsed.data.caption ?? null,
    uploadedById: user.id,
  }).returning();

  return res.status(201).json({ ...photo, uploadedByName: user.name });
});

router.post("/:id/evaluation", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user || (user.role !== "expert" && user.role !== "admin")) {
    return res.status(403).json({ error: "صلاحية الخبراء فقط" });
  }
  const paramsParsed = SubmitEvaluationParams.safeParse(req.params);
  const bodyParsed = SubmitEvaluationBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

  const [evaluation] = await db.insert(evaluationsTable).values({
    placeId: paramsParsed.data.id,
    expertId: user.id,
    hasRamp: bodyParsed.data.hasRamp,
    hasElevator: bodyParsed.data.hasElevator,
    hasAccessibleBathroom: bodyParsed.data.hasAccessibleBathroom,
    hasWideSpace: bodyParsed.data.hasWideSpace ?? false,
    hasGoodStaff: bodyParsed.data.hasGoodStaff ?? false,
    hasIndoorSigns: bodyParsed.data.hasIndoorSigns ?? false,
    notes: bodyParsed.data.notes ?? null,
    rating: bodyParsed.data.rating,
  }).returning();

  await db.update(placesTable).set({
    hasRamp: bodyParsed.data.hasRamp,
    hasElevator: bodyParsed.data.hasElevator,
    hasAccessibleBathroom: bodyParsed.data.hasAccessibleBathroom,
    hasWideSpace: bodyParsed.data.hasWideSpace ?? false,
    hasGoodStaff: bodyParsed.data.hasGoodStaff ?? false,
    hasIndoorSigns: bodyParsed.data.hasIndoorSigns ?? false,
    isVerified: true,
  }).where(eq(placesTable.id, paramsParsed.data.id));

  return res.status(201).json({ ...evaluation, expertName: user.name });
});

export default router;
