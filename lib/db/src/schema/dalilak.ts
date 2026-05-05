import { pgTable, serial, text, integer, boolean, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["visitor", "expert", "admin"]);
export const statusEnum = pgEnum("user_status", ["pending", "approved", "rejected", "active"]);
export const complaintStatusEnum = pgEnum("complaint_status", ["open", "resolved"]);
export const rampConditionEnum = pgEnum("ramp_condition", ["good", "fair", "poor"]);

export const governoratesTable = pgTable("governorates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
});

export const citiesTable = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  governorateId: integer("governorate_id").notNull().references(() => governoratesTable.id),
});

export const areasTable = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cityId: integer("city_id").notNull().references(() => citiesTable.id),
});

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("visitor"),
  status: statusEnum("status").notNull().default("active"),
  phone: text("phone"),
  accessCode: text("access_code").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const placesTable = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  phone: text("phone"),
  description: text("description"),
  governorateId: integer("governorate_id").notNull().references(() => governoratesTable.id),
  cityId: integer("city_id").notNull().references(() => citiesTable.id),
  areaId: integer("area_id").references(() => areasTable.id),
  addedById: integer("added_by_id").references(() => usersTable.id),
  isVerified: boolean("is_verified").notNull().default(false),
  hasRamp: boolean("has_ramp").default(false),
  hasElevator: boolean("has_elevator").default(false),
  hasAccessibleBathroom: boolean("has_accessible_bathroom").default(false),
  hasWideSpace: boolean("has_wide_space").default(false),
  hasGoodStaff: boolean("has_good_staff").default(false),
  hasIndoorSigns: boolean("has_indoor_signs").default(false),
  coverPhoto: text("cover_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photosTable = pgTable("place_photos", {
  id: serial("id").primaryKey(),
  placeId: integer("place_id").notNull().references(() => placesTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  uploadedById: integer("uploaded_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evaluationsTable = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  placeId: integer("place_id").notNull().references(() => placesTable.id, { onDelete: "cascade" }),
  expertId: integer("expert_id").notNull().references(() => usersTable.id),
  hasRamp: boolean("has_ramp").notNull().default(false),
  hasElevator: boolean("has_elevator").notNull().default(false),
  hasAccessibleBathroom: boolean("has_accessible_bathroom").notNull().default(false),
  hasWideSpace: boolean("has_wide_space").default(false),
  hasGoodStaff: boolean("has_good_staff").default(false),
  hasIndoorSigns: boolean("has_indoor_signs").default(false),
  notes: text("notes"),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  placeId: integer("place_id").references(() => placesTable.id),
  message: text("message").notNull(),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderPhone: text("sender_phone"),
  status: complaintStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlaceSchema = createInsertSchema(placesTable).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertEvaluationSchema = createInsertSchema(evaluationsTable).omit({ id: true, createdAt: true });
export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ id: true, createdAt: true });

export type Governorate = typeof governoratesTable.$inferSelect;
export type City = typeof citiesTable.$inferSelect;
export type Area = typeof areasTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type Place = typeof placesTable.$inferSelect;
export type Photo = typeof photosTable.$inferSelect;
export type Evaluation = typeof evaluationsTable.$inferSelect;
export type Complaint = typeof complaintsTable.$inferSelect;
