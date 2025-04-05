import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractFaceDescriptors, findMatchingPhotos } from './face-recognition';
import { setupAuth, isAuthenticated as authMiddleware, isAdmin as adminMiddleware, generateResetToken, isValidResetToken } from './auth';
import multer from 'multer';
import path from 'path';
import { 
  insertUserSchema, 
  userAuthSchema, 
  userPasswordResetSchema, 
  userResetPasswordSchema,
  insertEventSchema,
  insertPhotoSchema,
  insertPhotoHistorySchema,
  User
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

  // Setup auth middleware and auth routes
  setupAuth(app);

  // Legacy Auth endpoints (will be replaced by setupAuth routes)
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
      
      // Find all users and search for the one with the matching token
      const users = await storage.getUsers();
      const user = users.find((u: User) => u.resetToken === token);
      
      // Only checking if user exists for the demo
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      
      // Check token validity
      if (!user.resetToken || user.resetToken !== token || !isValidResetToken(user.resetTokenExpiry)) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      
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
        console.log('Invalid PIN verification request - missing eventId or pin');
        return res.status(400).json({ message: 'Event ID and PIN are required' });
      }
      
      console.log(`Processing PIN verification for event ${eventId} with PIN: ${pin}`);
      
      const numericEventId = parseInt(eventId);
      if (isNaN(numericEventId)) {
        console.log(`Invalid event ID: ${eventId}`);
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const event = await storage.getEvent(numericEventId);
      
      if (!event) {
        console.log(`Event not found: ${numericEventId}`);
        return res.status(404).json({ message: 'Event not found' });
      }
      
      console.log(`Verifying PIN for event: ${event.name} (ID: ${numericEventId})`);
      console.log(`Event PIN: "${event.pin}", Provided PIN: "${pin}"`);
      
      if (event.pin !== pin) {
        console.log(`PIN verification failed for event ${numericEventId}`);
        return res.status(403).json({ message: 'Invalid PIN' });
      }
      
      // Make sure the session object exists
      if (!req.session) {
        console.log('No session object available');
        return res.status(500).json({ message: 'Session not available' });
      }
      
      // Initialize eventPins object if it doesn't exist
      if (typeof (req.session as any).eventPins !== 'object') {
        console.log('Initializing eventPins in session');
        (req.session as any).eventPins = {};
      }
      
      // Save event access in the user's session
      (req.session as any).eventPins[numericEventId] = true;
      
      // Force session save to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
        } else {
          console.log('Session saved successfully');
        }
      });
      
      console.log(`PIN verification successful for event ${numericEventId}`);
      console.log('Updated session:', JSON.stringify(req.session));
      
      res.json({ message: 'Access granted', event });
    } catch (error) {
      console.error('Error in PIN verification:', error);
      res.status(500).json({ message: 'Failed to verify event access' });
    }
  });

  app.post('/api/events', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      console.log('Received event data:', req.body);
      
      // Process the date properly
      const data = { ...req.body };
      
      // If date is a string, convert it to a valid Date object
      if (typeof data.date === 'string') {
        // Ensure it's a valid date
        const parsedDate = new Date(data.date);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ 
            message: 'Invalid date format',
            details: `Could not parse date: ${data.date}`
          });
        }
        data.date = parsedDate.toISOString();
      }
      
      const validatedData = insertEventSchema.safeParse(data);
      
      if (!validatedData.success) {
        console.error('Validation error:', validatedData.error.format());
        return res.status(400).json({ 
          message: 'Invalid input data', 
          errors: validatedData.error.format() 
        });
      }
      
      const newEvent = await storage.createEvent(validatedData.data);
      res.status(201).json(newEvent);
    } catch (error) {
      console.error('Event creation error:', error);
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
      
      console.log('Received event update data:', req.body);
      
      // Process the date properly
      const data = { ...req.body };
      
      // If date is a string, convert it to a valid Date object
      if (typeof data.date === 'string') {
        // Ensure it's a valid date
        const parsedDate = new Date(data.date);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ 
            message: 'Invalid date format',
            details: `Could not parse date: ${data.date}`
          });
        }
        data.date = parsedDate.toISOString();
      }
      
      const validatedData = insertEventSchema.partial().safeParse(data);
      
      if (!validatedData.success) {
        console.error('Validation error:', validatedData.error.format());
        return res.status(400).json({ 
          message: 'Invalid input data', 
          errors: validatedData.error.format() 
        });
      }
      
      const updatedEvent = await storage.updateEvent(eventId, validatedData.data);
      res.json(updatedEvent);
    } catch (error) {
      console.error('Event update error:', error);
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
      
      console.log(`Request for photos of event ${eventId}`);
      
      // Check if the event has a PIN and if the user has access
      if (event.pin) {
        // Access debug information about the session
        console.log('Session data:', JSON.stringify(req.session || {}));
        
        // Get the user's session data for this event
        const sessionEventPins = (req.session as any).eventPins || {};
        console.log(`Event pins in session:`, sessionEventPins);
        
        const hasAccess = sessionEventPins[eventId] === true;
        console.log(`User has access to event ${eventId}: ${hasAccess}`);
        
        // Allow admin users to bypass PIN
        const isAdmin = req.isAuthenticated() && (req.user as any)?.isAdmin === true;
        console.log(`User is admin: ${isAdmin}`);
        
        if (!hasAccess && !isAdmin) {
          console.log(`Access denied to event ${eventId} photos - PIN required`);
          return res.status(403).json({ 
            message: 'PIN required to access this event',
            requiresPin: true
          });
        }
      }
      
      console.log(`Access granted to event ${eventId} photos`);
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
      
      // Get the actual photos and events
      const enrichedHistory = [];
      
      for (const record of photoHistoryRecords) {
        const photo = await storage.getPhoto(record.photoId);
        const event = await storage.getEvent(record.eventId);
        
        if (photo && event) {
          enrichedHistory.push({
            id: record.id,
            userId: record.userId,
            photoId: record.photoId,
            eventId: record.eventId,
            viewedAt: record.viewedAt,
            createdAt: record.viewedAt, // Use viewedAt for createdAt
            photo: photo,
            event: {
              id: event.id,
              name: event.name,
              date: event.date,
              location: event.location
            }
          });
        }
      }
      
      res.json(enrichedHistory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch photo history' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
