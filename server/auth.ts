import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from './storage';
import { User } from '@shared/schema';

// Simple authentication middleware - in a real app, would use JWT/sessions
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const [email, password] = Buffer.from(token, 'base64').toString().split(':');
    
    if (!email || !password) {
      return res.status(401).json({ message: 'Unauthorized - Invalid credentials format' });
    }
    
    const user = await storage.getUserByEmail(email);
    
    if (!user || user.password !== password) { // In real app would use bcrypt compare
      return res.status(401).json({ message: 'Unauthorized - Invalid credentials' });
    }
    
    // Attach user to request for use in routes
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

// Admin only middleware
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as User;
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }
  
  next();
};

// Generate a password reset token
export const generateResetToken = (): string => {
  return crypto.randomBytes(20).toString('hex');
};

// Check if a password reset token is valid
export const isValidResetToken = (tokenExpiry: Date | null): boolean => {
  if (!tokenExpiry) return false;
  return new Date() < tokenExpiry;
};
