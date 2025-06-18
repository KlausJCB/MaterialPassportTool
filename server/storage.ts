import {
  users,
  materialPassports,
  components,
  importJobs,
  type User,
  type UpsertUser,
  type MaterialPassport,
  type InsertMaterialPassport,
  type Component,
  type InsertComponent,
  type ImportJob,
  type InsertImportJob,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Material Passport operations
  getMaterialPassports(authorId?: string): Promise<MaterialPassport[]>;
  getMaterialPassport(id: number): Promise<MaterialPassport | undefined>;
  createMaterialPassport(passport: InsertMaterialPassport, authorId: string): Promise<MaterialPassport>;
  updateMaterialPassport(id: number, passport: Partial<InsertMaterialPassport>, authorId: string): Promise<MaterialPassport>;
  deleteMaterialPassport(id: number, authorId: string): Promise<boolean>;
  
  // Component operations
  getComponents(authorId?: string): Promise<Component[]>;
  createComponent(component: InsertComponent, authorId: string): Promise<Component>;
  
  // Import job operations
  createImportJob(job: InsertImportJob, authorId: string): Promise<ImportJob>;
  getImportJob(id: number): Promise<ImportJob | undefined>;
  updateImportJob(id: number, updates: Partial<InsertImportJob>): Promise<ImportJob>;
  
  // Dashboard stats
  getDashboardStats(authorId?: string): Promise<{
    totalPassports: number;
    completed: number;
    inProgress: number;
    totalComponents: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Material Passport operations
  async getMaterialPassports(authorId?: string): Promise<MaterialPassport[]> {
    const query = db
      .select()
      .from(materialPassports)
      .orderBy(desc(materialPassports.updatedAt));
    
    if (authorId) {
      return await query.where(eq(materialPassports.authorId, authorId));
    }
    
    return await query;
  }

  async getMaterialPassport(id: number): Promise<MaterialPassport | undefined> {
    const [passport] = await db
      .select()
      .from(materialPassports)
      .where(eq(materialPassports.id, id));
    return passport;
  }

  async createMaterialPassport(passport: InsertMaterialPassport, authorId: string): Promise<MaterialPassport> {
    const [created] = await db
      .insert(materialPassports)
      .values({ ...passport, authorId })
      .returning();
    return created;
  }

  async updateMaterialPassport(
    id: number, 
    passport: Partial<InsertMaterialPassport>, 
    authorId: string
  ): Promise<MaterialPassport> {
    const [updated] = await db
      .update(materialPassports)
      .set({ ...passport, updatedAt: new Date() })
      .where(and(
        eq(materialPassports.id, id),
        eq(materialPassports.authorId, authorId)
      ))
      .returning();
    return updated;
  }

  async deleteMaterialPassport(id: number, authorId: string): Promise<boolean> {
    const result = await db
      .delete(materialPassports)
      .where(and(
        eq(materialPassports.id, id),
        eq(materialPassports.authorId, authorId)
      ));
    return (result.rowCount || 0) > 0;
  }

  // Component operations
  async getComponents(authorId?: string): Promise<Component[]> {
    const query = db
      .select()
      .from(components)
      .orderBy(desc(components.createdAt));
    
    if (authorId) {
      return await query.where(eq(components.authorId, authorId));
    }
    
    return await query;
  }

  async createComponent(component: InsertComponent, authorId: string): Promise<Component> {
    const [created] = await db
      .insert(components)
      .values({ ...component, authorId })
      .returning();
    return created;
  }

  // Import job operations
  async createImportJob(job: InsertImportJob, authorId: string): Promise<ImportJob> {
    const [created] = await db
      .insert(importJobs)
      .values({ ...job, authorId })
      .returning();
    return created;
  }

  async getImportJob(id: number): Promise<ImportJob | undefined> {
    const [job] = await db
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, id));
    return job;
  }

  async updateImportJob(id: number, updates: Partial<InsertImportJob>): Promise<ImportJob> {
    const [updated] = await db
      .update(importJobs)
      .set(updates)
      .where(eq(importJobs.id, id))
      .returning();
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(authorId?: string): Promise<{
    totalPassports: number;
    completed: number;
    inProgress: number;
    totalComponents: number;
  }> {
    const whereClause = authorId ? eq(materialPassports.authorId, authorId) : undefined;
    
    const [stats] = await db
      .select({
        totalPassports: count(materialPassports.id),
        completed: count(sql`CASE WHEN ${materialPassports.status} = 'complete' THEN 1 END`),
        inProgress: count(sql`CASE WHEN ${materialPassports.status} = 'draft' THEN 1 END`),
      })
      .from(materialPassports)
      .where(whereClause);

    const [componentStats] = await db
      .select({
        totalComponents: count(components.id),
      })
      .from(components)
      .where(authorId ? eq(components.authorId, authorId) : undefined);

    return {
      totalPassports: stats.totalPassports,
      completed: stats.completed,
      inProgress: stats.inProgress,
      totalComponents: componentStats.totalComponents,
    };
  }
}

export const storage = new DatabaseStorage();
