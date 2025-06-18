import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("viewer"), // author, member, viewer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Material Passports
export const materialPassports = pgTable("material_passports", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, complete, published
  authorId: varchar("author_id").notNull(),
  
  // Physical Properties (Block 1)
  density: decimal("density", { precision: 10, scale: 3 }),
  volume: decimal("volume", { precision: 12, scale: 6 }),
  weight: decimal("weight", { precision: 12, scale: 3 }),
  strengthClass: varchar("strength_class"),
  serviceLife: integer("service_life"),
  fireResistance: varchar("fire_resistance"),
  contentReference: text("content_reference"),
  
  // Chemical/Health Properties (Block 2)
  constituents: jsonb("constituents"), // array of {material: string, percentage: number}
  svhcFlag: boolean("svhc_flag").default(false),
  reachCompliance: boolean("reach_compliance").default(false),
  vocClass: varchar("voc_class"),
  
  // Process/IDs (Block 3)
  gtin: varchar("gtin"),
  ean: varchar("ean"),
  cas: varchar("cas"),
  manufacturer: varchar("manufacturer"),
  bomObjectGuid: varchar("bom_object_guid"),
  
  // Circularity (Block 4)
  disassemblyRating: varchar("disassembly_rating"),
  recyclabilityPercentage: decimal("recyclability_percentage", { precision: 5, scale: 2 }),
  
  // LCA Data (Block 5)
  gwpA1: decimal("gwp_a1", { precision: 10, scale: 4 }),
  gwpA2: decimal("gwp_a2", { precision: 10, scale: 4 }),
  gwpA3: decimal("gwp_a3", { precision: 10, scale: 4 }),
  gwpTotal: decimal("gwp_total", { precision: 10, scale: 4 }),
  stageDReduction: decimal("stage_d_reduction", { precision: 10, scale: 4 }),
  netGwp: decimal("net_gwp", { precision: 10, scale: 4 }),
  
  // Additional LCA impacts
  odp: decimal("odp", { precision: 15, scale: 10 }),
  acidificationPotential: decimal("acidification_potential", { precision: 10, scale: 6 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Component Library
export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  ifcGuid: varchar("ifc_guid"),
  passportId: integer("passport_id"),
  authorId: varchar("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Import Jobs
export const importJobs = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(), // ifc, excel, epd
  filename: varchar("filename").notNull(),
  status: varchar("status").notNull().default("processing"), // processing, completed, failed
  resultData: jsonb("result_data"),
  errorMessage: text("error_message"),
  authorId: varchar("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertMaterialPassportSchema = createInsertSchema(materialPassports).omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComponentSchema = createInsertSchema(components).omit({
  id: true,
  authorId: true,
  createdAt: true,
});

export const insertImportJobSchema = createInsertSchema(importJobs).omit({
  id: true,
  authorId: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMaterialPassport = z.infer<typeof insertMaterialPassportSchema>;
export type MaterialPassport = typeof materialPassports.$inferSelect;
export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type Component = typeof components.$inferSelect;
export type InsertImportJob = z.infer<typeof insertImportJobSchema>;
export type ImportJob = typeof importJobs.$inferSelect;
