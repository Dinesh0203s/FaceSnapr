import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { userAuthSchema } from "@shared/schema";

const formSchema = userAuthSchema.extend({
  rememberMe: z.boolean().default(false),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  const isAuthenticated = !!user;
  
  // Redirect if already logged in
  // Use useEffect to handle redirects to avoid React render phase state updates
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    loginMutation.mutate({ 
      email: values.email, 
      password: values.password 
    }, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  }

  return (
    <MainLayout hideFooter>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg">
          <div>
            <div className="flex justify-center">
              <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 4L15 4M15 4C15 5.10457 14.1046 6 13 6H11C9.89543 6 9 5.10457 9 4M15 4C15 2.89543 14.1046 2 13 2H11C9.89543 2 9 2.89543 9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 4L7.44721 5.55279C7.16569 5.83431 7 6.20739 7 6.60005V15.4C7 15.7927 7.16569 16.1658 7.44721 16.4473L7.5 16.5M15 4L16.5528 5.55279C16.8343 5.83431 17 6.20739 17 6.60005V15.4C17 15.7927 16.8343 16.1658 16.5528 16.4473L16.5 16.5M7 20L10 17M17 20L14 17M10 17L12 19L14 17M10 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Or{" "}
              <Link href="/register" className="font-medium text-primary hover:text-primary/80">
                create a new account
              </Link>
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
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Remember me</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sign in
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </MainLayout>
  );
}
