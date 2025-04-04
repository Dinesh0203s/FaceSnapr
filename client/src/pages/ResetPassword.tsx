import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";

const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [, params] = useRoute("/reset-password");
  const [, navigate] = useLocation();

  // Extract token from URL
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const success = await resetPassword(token, values.password);
      setStatus(success ? "success" : "error");
    } catch (error) {
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return null;
  }

  return (
    <MainLayout hideFooter>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg">
          {status === "idle" ? (
            <>
              <div>
                <div className="flex justify-center">
                  <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 4L15 4M15 4C15 5.10457 14.1046 6 13 6H11C9.89543 6 9 5.10457 9 4M15 4C15 2.89543 14.1046 2 13 2H11C9.89543 2 9 2.89543 9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M9 4L7.44721 5.55279C7.16569 5.83431 7 6.20739 7 6.60005V15.4C7 15.7927 7.16569 16.1658 7.44721 16.4473L7.5 16.5M15 4L16.5528 5.55279C16.8343 5.83431 17 6.20739 17 6.60005V15.4C17 15.7927 16.8343 16.1658 16.5528 16.4473L16.5 16.5M7 20L10 17M17 20L14 17M10 17L12 19L14 17M10 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                  Set new password
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Please enter your new password below.
                </p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Reset Password
                  </Button>
                </form>
              </Form>
            </>
          ) : status === "success" ? (
            <div className="text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
              <h2 className="mt-6 text-center text-2xl font-bold text-foreground">
                Password reset successful
              </h2>
              <p className="mt-2 text-muted-foreground">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Button
                className="mt-6"
                asChild
              >
                <Link href="/login">
                  <a>Go to Login</a>
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <h2 className="mt-6 text-center text-2xl font-bold text-foreground">
                Password reset failed
              </h2>
              <p className="mt-2 text-muted-foreground">
                There was an error resetting your password. The reset link may have expired or been used already.
              </p>
              <Button
                className="mt-6"
                asChild
              >
                <Link href="/forgot-password">
                  <a>Try Again</a>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
