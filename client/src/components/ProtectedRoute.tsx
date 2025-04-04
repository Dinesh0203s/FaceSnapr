import { ReactNode, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [match] = useRoute('/login');

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setLocation('/login');
      } else if (adminOnly && !isAdmin) {
        setLocation('/'); // Redirect non-admin users to home
      }
    }
  }, [isAuthenticated, isAdmin, loading, setLocation, adminOnly]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated && !match) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
