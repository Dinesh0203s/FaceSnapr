import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

// Event relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
    relationName: "user_events"
  }),
  photos: many(photos, { relationName: "event_photos" }),
  photoHistory: many(photoHistory, { relationName: "event_photo_history" }),
}));

// Custom schema for event insertion with date handling
export const insertEventSchema = createInsertSchema(events)
  .pick({
    name: true,
    description: true,
    location: true,
    pin: true,
    createdBy: true,
  })
  .extend({
    // Accept both Date objects and ISO strings for the date field
    date: z.union([
      z.date(),
      z.string().refine(
        (val) => !isNaN(new Date(val).getTime()),
        { message: "Invalid date string format" }
      )
    ]),
  });

// Photo schema
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  url: text("url").notNull(),
  faceData: text("face_data"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Photo relations
export const photosRelations = relations(photos, ({ one, many }) => ({
  event: one(events, {
    fields: [photos.eventId],
    references: [events.id],
    relationName: "event_photos"
  }),
  photoHistory: many(photoHistory, { relationName: "photo_history" }),
}));

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

// Photo history relations
export const photoHistoryRelations = relations(photoHistory, ({ one }) => ({
  user: one(users, {
    fields: [photoHistory.userId],
    references: [users.id],
    relationName: "user_photo_history"
  }),
  event: one(events, {
    fields: [photoHistory.eventId],
    references: [events.id],
    relationName: "event_photo_history"
  }),
  photo: one(photos, {
    fields: [photoHistory.photoId],
    references: [photos.id],
    relationName: "photo_history"
  }),
}));

export const insertPhotoHistorySchema = createInsertSchema(photoHistory).pick({
  userId: true,
  photoId: true,
  eventId: true,
});

// User relations - defined last to avoid forward reference issues
export const usersRelations = relations(users, ({ many }) => ({
  events: many(events, { relationName: "user_events" }),
  photoHistory: many(photoHistory, { relationName: "user_photo_history" }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type PhotoHistory = typeof photoHistory.$inferSelect;
export type InsertPhotoHistory = z.infer<typeof insertPhotoHistorySchema>;
