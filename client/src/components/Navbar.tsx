import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut,
  UserPlus,
  Moon,
  Sun
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return user?.username?.substring(0, 1).toUpperCase() || 'U';
    
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-card/60 shadow-md backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 4L15 4M15 4C15 5.10457 14.1046 6 13 6H11C9.89543 6 9 5.10457 9 4M15 4C15 2.89543 14.1046 2 13 2H11C9.89543 2 9 2.89543 9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 4L7.44721 5.55279C7.16569 5.83431 7 6.20739 7 6.60005V15.4C7 15.7927 7.16569 16.1658 7.44721 16.4473L7.5 16.5M15 4L16.5528 5.55279C16.8343 5.83431 17 6.20739 17 6.60005V15.4C17 15.7927 16.8343 16.1658 16.5528 16.4473L16.5 16.5M7 20L10 17M17 20L14 17M10 17L12 19L14 17M10 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-bold text-xl ml-2 text-foreground">FaceFind</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <Link href="/" className={`text-sm px-3 py-2 font-medium border-b-2 ${isActive('/') ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                Home
              </Link>
              <Link href="/events" className={`text-sm px-3 py-2 font-medium border-b-2 ${isActive('/events') ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                Events
              </Link>
              <Link href="/contact" className={`text-sm px-3 py-2 font-medium border-b-2 ${isActive('/contact') ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                Contact
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-2">
            {/* Theme toggle button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 bg-gradient-to-r from-primary to-purple-500">
                      <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    Log in
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register" className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign up
                  </Link>
                </Button>
              </div>
            )}
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon" 
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-card border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/events"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/events') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link 
              href="/contact"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/contact') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <button
              className={`flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground`}
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
          
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-border">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10 bg-gradient-to-r from-primary to-purple-500">
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-foreground">{user?.name || user?.username}</div>
                  <div className="text-sm font-medium text-muted-foreground">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link 
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Your Profile
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-border px-5 space-y-2">
              <Button className="w-full" asChild>
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link 
                  href="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
