"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
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
import { registerUser, authStorage } from "@/lib/api-service";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerStatus, setRegisterStatus] = useState<
    "idle" | "success" | "error" | "warning"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setRegisterStatus("error");
      setStatusMessage("Passwords do not match");
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRegisterStatus("idle");

    try {
      console.log("Submitting registration form:", { name, email });
      const data = await registerUser(name, email, password);

      if (data.success) {
        // Check if there's a warning about MongoDB being unavailable
        if (data.warning) {
          setRegisterStatus("warning");
          setStatusMessage(`${data.message}. ${data.warning}`);
          toast({
            title: "Warning",
            description: data.warning,
            variant: "default",
          });
        } else {
          setRegisterStatus("success");
          setStatusMessage(
            "Account created successfully! Redirecting to dashboard..."
          );
          toast({
            title: "Success",
            description: "Your account has been created",
          });
        }

        // If we have a user object, store it
        if (data.user) {
          authStorage.setUser(data.user);

          // Redirect to dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          // Redirect to login page with success message
          setTimeout(() => {
            const message = encodeURIComponent(
              "Registration successful! Please log in with your new account."
            );
            router.push(`/login?status=success&message=${message}`);
          }, 2000);
        }
      } else {
        setRegisterStatus("error");
        setStatusMessage(
          data.message ||
            "Registration failed. This email may already be registered."
        );
        toast({
          title: "Error",
          description:
            data.message ||
            "Registration failed. This email may already be registered.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterStatus("error");
      setStatusMessage(
        "An error occurred during registration. Please try again."
      );
      toast({
        title: "Error",
        description: "An error occurred during registration. Please try again.",
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
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>

        {registerStatus !== "idle" && (
          <div className="px-6 pb-4">
            <Alert
              variant={
                registerStatus === "success"
                  ? "default"
                  : registerStatus === "warning"
                  ? "default"
                  : "destructive"
              }
              className="flex items-center"
            >
              <div className="flex-shrink-0 mr-2">
                {registerStatus === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : registerStatus === "warning" ? (
                  <Info className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div>
                <AlertTitle className="text-sm font-medium">
                  {registerStatus === "success"
                    ? "Success"
                    : registerStatus === "warning"
                    ? "Warning"
                    : "Error"}
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              className="w-full"
              type="submit"
              disabled={isLoading || registerStatus === "success"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
