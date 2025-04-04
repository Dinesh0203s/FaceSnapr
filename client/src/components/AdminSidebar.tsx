import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  ImageIcon,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
      exact: true
    },
    {
      name: 'Events',
      href: '/admin/events',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      name: 'Photos',
      href: '/admin/photos',
      icon: <ImageIcon className="h-5 w-5" />
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />
    },
  ];

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
          {!collapsed && (
            <div className="flex items-center">
              <svg className="h-8 w-8 text-sidebar-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 4L15 4M15 4C15 5.10457 14.1046 6 13 6H11C9.89543 6 9 5.10457 9 4M15 4C15 2.89543 14.1046 2 13 2H11C9.89543 2 9 2.89543 9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 4L7.44721 5.55279C7.16569 5.83431 7 6.20739 7 6.60005V15.4C7 15.7927 7.16569 16.1658 7.44721 16.4473L7.5 16.5M15 4L16.5528 5.55279C16.8343 5.83431 17 6.20739 17 6.60005V15.4C17 15.7927 16.8343 16.1658 16.5528 16.4473L16.5 16.5M7 20L10 17M17 20L14 17M10 17L12 19L14 17M10 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2 className="ml-2 text-lg font-semibold text-sidebar-foreground">Admin</h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
              >
                <a 
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive(item.href) && (!item.exact || item.href === location)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </a>
              </Link>
            ))}
          </nav>
        </div>
        
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || 'A'}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-sidebar-foreground">{user?.name || user?.username}</p>
                <p className="text-xs text-sidebar-foreground/60">{user?.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
