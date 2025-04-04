import { ReactNode } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to access this area.
        </p>
        <Button onClick={() => setLocation("/")}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          <div className="p-6">
            {title && (
              <h1 className="text-2xl font-bold mb-6">{title}</h1>
            )}
            {children}
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
