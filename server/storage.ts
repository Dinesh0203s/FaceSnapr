import { 
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  photos, type Photo, type InsertPhoto,
  photoHistory, type PhotoHistory, type InsertPhotoHistory
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
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
      ...insertUser, 
      id,
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
    const event: Event = { 
      ...insertEvent, 
      id,
      createdAt: now
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent: Event = { ...event, ...updates };
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
      ...insertPhoto, 
      id,
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
      ...insertHistory, 
      id,
      viewedAt: now
    };
    this.photoHistory.set(id, history);
    return history;
  }
}

export const storage = new MemStorage();
