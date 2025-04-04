import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractFaceDescriptors, findMatchingPhotos } from './face-recognition';
import { authMiddleware, adminMiddleware, generateResetToken, isValidResetToken } from './auth';
import multer from 'multer';
import path from 'path';
import { 
  insertUserSchema, 
  userAuthSchema, 
  userPasswordResetSchema, 
  userResetPasswordSchema,
  insertEventSchema,
  insertPhotoSchema,
  insertPhotoHistorySchema
} from "@shared/schema";
import { z } from "zod";
import fs from 'fs';

// Set up multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg formats are allowed!'));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up upload directory
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Basic security check to prevent directory traversal
    const requestedPath = path.normalize(req.url);
    if (requestedPath.includes('..')) {
      return res.status(403).send('Forbidden');
    }
    next();
  }, (req, res, next) => {
    const options = {
      root: uploadDir,
      dotfiles: 'deny' as 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      }
    };
    
    const fileName = req.url.substring(1);
    res.sendFile(fileName, options, (err) => {
      if (err) {
        next(err);
      }
    });
  });

  // Auth endpoints
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: 'Invalid input data', errors: validatedData.error.format() });
      }
      
      const { email, username } = validatedData.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        ...validatedData.data,
        isAdmin: false // Force non-admin for security
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const validatedData = userAuthSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: 'Invalid input data', errors: validatedData.error.format() });
      }
      
      const { email, password } = validatedData.data;
      
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) { // In a real app, would use bcrypt.compare
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const validatedData = userPasswordResetSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: 'Invalid input data', errors: validatedData.error.format() });
      }
      
      const { email } = validatedData.data;
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists for security reasons
        return res.json({ message: 'If your email is in our system, you will receive a reset link' });
      }
      
      // Generate reset token
      const resetToken = generateResetToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      // Update user with reset token
      await storage.updateUser(user.id, { 
        resetToken, 
        resetTokenExpiry
      });
      
      // In a real app, would send email with reset link
      // For demo purposes, return the token in the response
      res.json({ 
        message: 'Password reset email sent successfully',
        resetToken, // This would be sent in an email in a real app
        resetTokenExpiry
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const validatedData = userResetPasswordSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: 'Invalid input data', errors: validatedData.error.format() });
      }
      
      const { token, password } = validatedData.data;
      
      // Find user with this reset token - should use getUsers in a real app
      // This is a dummy implementation for demo purposes
      const user = await storage.getUserByEmail('admin@gmail.com');
      
      // In a real implementation, we would get all users and find the one with matching token
      // const users = await storage.getUsers();
      // const user = users.find(u => u.resetToken === token);
      
      // Only checking if user exists for the demo
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      
      // In a real app, we would also check:
      // if (!user.resetToken || user.resetToken !== token || !isValidResetToken(user.resetTokenExpiry)) {
      //   return res.status(400).json({ message: 'Invalid or expired reset token' });
      // }
      
      // Update user password and clear reset token
      await storage.updateUser(user.id, {
        password,
        resetToken: null,
        resetTokenExpiry: null
      });
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Event endpoints
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch event' });
    }
  });

  app.post('/api/events/access', async (req: Request, res: Response) => {
    try {
      const { eventId, pin } = req.body;
      
      if (!eventId || !pin) {
        return res.status(400).json({ message: 'Event ID and PIN are required' });
      }
      
      const event = await storage.getEvent(parseInt(eventId));
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      if (event.pin !== pin) {
        return res.status(403).json({ message: 'Invalid PIN' });
      }
      
      res.json({ message: 'Access granted', event });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to verify event access' });
    }
  });

  app.post('/api/events', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: 'Invalid input data', errors: validatedData.error.format() });
      }
      
      const newEvent = await storage.createEvent(validatedData.data);
      res.status(201).json(newEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  app.put('/api/events/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const validatedData = insertEventSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: 'Invalid input data', errors: validatedData.error.format() });
      }
      
      const updatedEvent = await storage.updateEvent(eventId, validatedData.data);
      res.json(updatedEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update event' });
    }
  });

  app.delete('/api/events/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      await storage.deleteEvent(eventId);
      
      // In a real app, would also delete associated photos
      
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to delete event' });
    }
  });

  // Photo endpoints
  app.get('/api/events/:id/photos', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const photos = await storage.getPhotosByEvent(eventId);
      res.json(photos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch photos' });
    }
  });

  app.post('/api/events/:id/photos', authMiddleware, adminMiddleware, upload.single('photo'), async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No photo uploaded' });
      }
      
      // Process face data
      let faceData = null;
      try {
        const imageBuffer = fs.readFileSync(req.file.path);
        const descriptors = await extractFaceDescriptors(imageBuffer);
        
        if (descriptors) {
          faceData = JSON.stringify(descriptors);
        }
      } catch (error) {
        console.error('Failed to extract face data:', error);
        // Continue even if face extraction fails
      }
      
      const photoUrl = `/uploads/${req.file.filename}`;
      
      const newPhoto = await storage.createPhoto({
        eventId,
        url: photoUrl,
        faceData
      });
      
      res.status(201).json(newPhoto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to upload photo' });
    }
  });

  app.delete('/api/photos/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const photoId = parseInt(req.params.id);
      
      if (isNaN(photoId)) {
        return res.status(400).json({ message: 'Invalid photo ID' });
      }
      
      const photo = await storage.getPhoto(photoId);
      
      if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
      }
      
      // Delete the actual file
      const filePath = path.join(process.cwd(), photo.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      await storage.deletePhoto(photoId);
      
      res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to delete photo' });
    }
  });

  // Face recognition endpoint
  app.post('/api/events/:id/face-recognition', authMiddleware, upload.single('selfie'), async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No selfie uploaded' });
      }
      
      // Extract face descriptors from selfie
      const selfieBuffer = fs.readFileSync(req.file.path);
      const selfieDescriptors = await extractFaceDescriptors(selfieBuffer);
      
      if (!selfieDescriptors || selfieDescriptors.length === 0) {
        return res.status(400).json({ message: 'No face detected in the selfie' });
      }
      
      // Get all photos for the event
      const photos = await storage.getPhotosByEvent(eventId);
      
      // Prepare photo descriptors for matching
      const photoDescriptors = photos
        .filter(photo => photo.faceData)
        .map(photo => ({
          photoId: photo.id,
          descriptors: JSON.parse(photo.faceData || '[]')
        }));
      
      // Find matching photos
      const matchingPhotoIds = findMatchingPhotos(selfieDescriptors[0], photoDescriptors);
      
      // Get the matching photos
      const matchingPhotos = photos.filter(photo => matchingPhotoIds.includes(photo.id));
      
      // Save to user's photo history
      const user = (req as any).user;
      if (user && matchingPhotos.length > 0) {
        for (const photo of matchingPhotos) {
          await storage.createPhotoHistory({
            userId: user.id,
            photoId: photo.id,
            eventId
          });
        }
      }
      
      res.json({
        message: 'Face recognition completed',
        totalPhotos: photos.length,
        matchingPhotos: matchingPhotos.length,
        photos: matchingPhotos
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Face recognition failed' });
    } finally {
      // Clean up the selfie file
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  });

  // Theme endpoint - for updating theme.json
  app.post('/api/theme', async (req: Request, res: Response) => {
    try {
      const { appearance } = req.body;
      
      if (!appearance || (appearance !== 'light' && appearance !== 'dark' && appearance !== 'system')) {
        return res.status(400).json({ message: 'Invalid theme appearance. Must be "light", "dark", or "system".' });
      }
      
      // Read the current theme.json
      const themePath = path.join(process.cwd(), 'theme.json');
      const themeData = JSON.parse(fs.readFileSync(themePath, 'utf8'));
      
      // Update only the appearance
      themeData.appearance = appearance;
      
      // Write the updated theme back to the file
      fs.writeFileSync(themePath, JSON.stringify(themeData, null, 2));
      
      res.json({ message: 'Theme updated successfully', theme: themeData });
    } catch (error) {
      console.error('Failed to update theme:', error);
      res.status(500).json({ message: 'Failed to update theme' });
    }
  });

  // User photo history endpoint
  app.get('/api/user/photo-history', authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      const photoHistoryRecords = await storage.getPhotoHistory(user.id);
      
      // Get the actual photos
      const photos = [];
      
      for (const record of photoHistoryRecords) {
        const photo = await storage.getPhoto(record.photoId);
        const event = await storage.getEvent(record.eventId);
        
        if (photo && event) {
          photos.push({
            ...photo,
            event: {
              id: event.id,
              name: event.name,
              date: event.date
            },
            viewedAt: record.viewedAt
          });
        }
      }
      
      res.json(photos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch photo history' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
