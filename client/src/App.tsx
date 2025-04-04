import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Contact from "@/pages/Contact";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import UserProfile from "@/pages/UserProfile";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminEvents from "@/pages/AdminEvents";
import AdminAddEvent from "@/pages/AdminAddEvent";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/contact" component={Contact} />
      <Route path="/events" component={Events} />
      <Route path="/events/:id">
        {params => <EventDetail id={parseInt(params.id)} />}
      </Route>
      <Route path="/profile">
        {() => (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/events">
        {() => (
          <ProtectedRoute adminOnly>
            <AdminEvents />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/events/add">
        {() => (
          <ProtectedRoute adminOnly>
            <AdminAddEvent />
          </ProtectedRoute>
        )}
      </Route>
      {/* Remove admin edit event and admin photos routes until implemented */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <Router />
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
