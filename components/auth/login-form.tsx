"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCurrentUser, authStorage } from "@/lib/api-service";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Check for status in URL params (e.g., after logout)
  useEffect(() => {
    const status = searchParams.get("status");
    const message = searchParams.get("message");

    if (status === "success" && message) {
      setLoginStatus("success");
      setStatusMessage(decodeURIComponent(message));
    } else if (status === "error" && message) {
      setLoginStatus("error");
      setStatusMessage(decodeURIComponent(message));
    }
  }, [searchParams]);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        // First check local storage for faster response
        if (authStorage.isAuthenticated()) {
          router.push("/dashboard");
          return;
        }

        // Then try API
        const data = await getCurrentUser();
        if (data.user) {
          authStorage.setUser(data.user);
          router.push("/dashboard");
        }
      } catch (err) {
        console.log("Auth check failed:", err);
        // Continue showing login form
      }
    };

    checkAuth();
  }, [router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setLoginStatus("idle");
    setDebugInfo(null);

    try {
      // For demo purposes, allow login with demo credentials
      if (email === "demo@example.com" && password === "password") {
        const demoUser = {
          name: "Demo User",
          email: "demo@example.com",
          role: "doctor",
        };
        authStorage.setUser(demoUser);
        setLoginStatus("success");
        setStatusMessage("Login successful! Redirecting to dashboard...");

        // Short delay before redirect for user to see success message
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        setIsLoading(false);
        return;
      }

      console.log("Attempting login with:", { email, password });

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      // Get the response data
      const data = await response.json();
      console.log("Login response:", data);

      // Store debug info
      setDebugInfo(
        JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            data,
          },
          null,
          2
        )
      );

      if (data.success) {
        authStorage.setUser(data.user);
        setLoginStatus("success");
        setStatusMessage("Login successful! Redirecting to dashboard...");

        // Short delay before redirect for user to see success message
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setLoginStatus("error");
        setStatusMessage(data.message || "Invalid credentials");
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginStatus("error");
      setStatusMessage("An error occurred during login. Please try again.");
      setDebugInfo(JSON.stringify({ error: String(error) }, null, 2));
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="h-12 w-12 mb-2">
            <img
              src="/images/mediscan-logo.png"
              alt="MediScan Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-center">MediScan</CardTitle>
          <CardDescription className="text-center">
            AI-powered pneumonia detection from chest X-rays
          </CardDescription>
        </CardHeader>

        {loginStatus !== "idle" && (
          <div className="px-6 pb-4">
            <Alert
              variant={loginStatus === "success" ? "default" : "destructive"}
              className="flex items-center"
            >
              <div className="flex-shrink-0 mr-2">
                {loginStatus === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div>
                <AlertTitle className="text-sm font-medium">
                  {loginStatus === "success" ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {statusMessage}
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Demo credentials:</p>
              <p>Email: demo@example.com</p>
              <p>Password: password</p>
            </div>

            {debugInfo && (
              <div className="mt-4 p-2 bg-muted rounded-md">
                <p className="text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                  {debugInfo}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
