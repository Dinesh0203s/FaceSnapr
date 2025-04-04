import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  isAdmin: true,
});

export const userAuthSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const userPasswordResetSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const userResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Event schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location"),
  pin: text("pin").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  name: true,
  description: true,
  date: true,
  location: true,
  pin: true,
  createdBy: true,
});

// Photo schema
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  url: text("url").notNull(),
  faceData: text("face_data"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  eventId: true,
  url: true,
  faceData: true,
});

// User photo history schema
export const photoHistory = pgTable("photo_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  photoId: integer("photo_id").notNull(),
  eventId: integer("event_id").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const insertPhotoHistorySchema = createInsertSchema(photoHistory).pick({
  userId: true,
  photoId: true,
  eventId: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type PhotoHistory = typeof photoHistory.$inferSelect;
export type InsertPhotoHistory = z.infer<typeof insertPhotoHistorySchema>;
