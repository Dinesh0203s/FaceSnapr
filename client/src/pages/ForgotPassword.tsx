import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle2 } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { userPasswordResetSchema } from "@shared/schema";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof userPasswordResetSchema>>({
    resolver: zodResolver(userPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof userPasswordResetSchema>) {
    setIsLoading(true);
    try {
      await forgotPassword(values.email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <MainLayout hideFooter>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg">
          {!isSubmitted ? (
            <>
              <div>
                <div className="flex justify-center">
                  <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 4L15 4M15 4C15 5.10457 14.1046 6 13 6H11C9.89543 6 9 5.10457 9 4M15 4C15 2.89543 14.1046 2 13 2H11C9.89543 2 9 2.89543 9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M9 4L7.44721 5.55279C7.16569 5.83431 7 6.20739 7 6.60005V15.4C7 15.7927 7.16569 16.1658 7.44721 16.4473L7.5 16.5M15 4L16.5528 5.55279C16.8343 5.83431 17 6.20739 17 6.60005V15.4C17 15.7927 16.8343 16.1658 16.5528 16.4473L16.5 16.5M7 20L10 17M17 20L14 17M10 17L12 19L14 17M10 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                  Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" {...field} />
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
                    Send Reset Link
                  </Button>
                </form>
              </Form>
              
              <div className="text-center mt-4">
                <Link href="/login">
                  <a className="text-sm font-medium text-primary hover:text-primary/80">
                    Back to login
                  </a>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
              <h2 className="mt-6 text-center text-2xl font-bold text-foreground">
                Check your email
              </h2>
              <p className="mt-2 text-muted-foreground">
                If your email address exists in our database, you will receive a password recovery link at your email address shortly.
              </p>
              <Button
                className="mt-6"
                asChild
              >
                <Link href="/login">
                  <a>Return to Login</a>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
