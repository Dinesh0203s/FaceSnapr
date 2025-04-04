import { 
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  photos, type Photo, type InsertPhoto,
  photoHistory, type PhotoHistory, type InsertPhotoHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getEventsByUser(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Photo operations
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByEvent(eventId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, updates: Partial<Photo>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;
  
  // Photo history operations
  getPhotoHistory(userId: number): Promise<PhotoHistory[]>;
  createPhotoHistory(history: InsertPhotoHistory): Promise<PhotoHistory>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private photos: Map<number, Photo>;
  private photoHistory: Map<number, PhotoHistory>;
  
  private userIdCounter: number;
  private eventIdCounter: number;
  private photoIdCounter: number;
  private photoHistoryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.photos = new Map();
    this.photoHistory = new Map();
    
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.photoIdCounter = 1;
    this.photoHistoryIdCounter = 1;
    
    // Add admin user
    this.createUser({
      username: "admin",
      email: "admin@gmail.com",
      password: "dinesh.s123", // In a real app, this would be hashed
      name: "Admin User",
      isAdmin: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name ?? null,
      isAdmin: insertUser.isAdmin ?? false,
      createdAt: now,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...updates };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEventsByUser(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.createdBy === userId,
    );
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const now = new Date();
    
    // Handle date format
    const eventData = { ...insertEvent };
    
    // If date is a string, convert to Date if needed
    if (typeof eventData.date === 'string') {
      eventData.date = new Date(eventData.date);
    }
    
    const event: Event = { 
      id,
      name: eventData.name,
      description: eventData.description ?? null,
      date: eventData.date,
      location: eventData.location ?? null,
      pin: eventData.pin,
      createdBy: eventData.createdBy,
      createdAt: now
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    // Handle date format
    const updateData = { ...updates };
    
    // If date is a string, convert to Date if needed
    if (updateData.date && typeof updateData.date === 'string') {
      updateData.date = new Date(updateData.date);
    }
    
    const updatedEvent: Event = { ...event, ...updateData };
    this.events.set(id, updatedEvent);
    
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Photo operations
  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async getPhotosByEvent(eventId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(
      (photo) => photo.eventId === eventId,
    );
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.photoIdCounter++;
    const now = new Date();
    const photo: Photo = { 
      id,
      eventId: insertPhoto.eventId,
      url: insertPhoto.url,
      faceData: insertPhoto.faceData ?? null,
      uploadedAt: now
    };
    this.photos.set(id, photo);
    return photo;
  }

  async updatePhoto(id: number, updates: Partial<Photo>): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    
    const updatedPhoto: Photo = { ...photo, ...updates };
    this.photos.set(id, updatedPhoto);
    
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Photo history operations
  async getPhotoHistory(userId: number): Promise<PhotoHistory[]> {
    return Array.from(this.photoHistory.values()).filter(
      (history) => history.userId === userId,
    ).sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());
  }

  async createPhotoHistory(insertHistory: InsertPhotoHistory): Promise<PhotoHistory> {
    const id = this.photoHistoryIdCounter++;
    const now = new Date();
    const history: PhotoHistory = { 
      id,
      userId: insertHistory.userId,
      photoId: insertHistory.photoId,
      eventId: insertHistory.eventId,
      viewedAt: now
    };
    this.photoHistory.set(id, history);
    return history;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEventsByUser(userId: number): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.createdBy, userId))
      .orderBy(desc(events.createdAt));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    // Handle date format
    const eventData = { ...insertEvent };
    
    // If date is a string, convert to Date if needed
    if (typeof eventData.date === 'string') {
      eventData.date = new Date(eventData.date);
    }
    
    // @ts-ignore - Handle TypeScript error about string | Date
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    // Handle date format
    const updateData = { ...updates };
    
    // If date is a string, convert to Date if needed
    if (updateData.date && typeof updateData.date === 'string') {
      updateData.date = new Date(updateData.date);
    }
    
    // @ts-ignore - Handle TypeScript error about string | Date
    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Photo operations
  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo;
  }

  async getPhotosByEvent(eventId: number): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.eventId, eventId))
      .orderBy(desc(photos.uploadedAt));
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db.insert(photos).values(insertPhoto).returning();
    return photo;
  }

  async updatePhoto(id: number, updates: Partial<Photo>): Promise<Photo | undefined> {
    const [updatedPhoto] = await db
      .update(photos)
      .set(updates)
      .where(eq(photos.id, id))
      .returning();
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Photo history operations
  async getPhotoHistory(userId: number): Promise<PhotoHistory[]> {
    return await db
      .select()
      .from(photoHistory)
      .where(eq(photoHistory.userId, userId))
      .orderBy(desc(photoHistory.viewedAt));
  }

  async createPhotoHistory(insertHistory: InsertPhotoHistory): Promise<PhotoHistory> {
    try {
      const [history] = await db.insert(photoHistory).values(insertHistory).returning();
      return history;
    } catch (error) {
      console.error("Error creating photo history:", error);
      throw error;
    }
  }
}

// Use Database storage instead of in-memory storage
export const storage = new DatabaseStorage();
