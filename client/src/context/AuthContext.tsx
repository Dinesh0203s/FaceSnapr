import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  name?: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const userData = await response.json();
      
      // Save user to state and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('auth', btoa(`${email}:${password}`));
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.name || userData.username}!`,
      });
      
      return true;
    } catch (error) {
      let errorMsg = 'Login failed. Please check your credentials and try again.';
      
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      toast({
        title: 'Login Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      
      return false;
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const newUser = await response.json();
      
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. You can now log in.',
      });
      
      return true;
    } catch (error) {
      let errorMsg = 'Registration failed. Please try again.';
      
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      toast({
        title: 'Registration Failed',
        description: errorMsg,
        variant: 'destructive',
      });
      
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth');
    
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      await apiRequest('POST', '/api/auth/forgot-password', { email });
      
      toast({
        title: 'Password Reset Initiated',
        description: 'If your email is in our system, you will receive password reset instructions shortly.',
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Password Reset Failed',
        description: 'Unable to process your request. Please try again later.',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    try {
      await apiRequest('POST', '/api/auth/reset-password', { token, password });
      
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now log in with your new password.',
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Password Reset Failed',
        description: 'Invalid or expired reset token. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
