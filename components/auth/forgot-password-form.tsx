"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
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
import { requestPasswordReset } from "@/lib/api-service";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [statusMessage, setStatusMessage] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setResetStatus("idle");

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setSubmitted(true);
        setResetStatus("success");
        setStatusMessage(
          `If an account exists with ${email}, you will receive password reset instructions.`
        );

        toast({
          title: "Email sent",
          description:
            "If an account exists with this email, you will receive password reset instructions.",
        });
      } else {
        setResetStatus("error");
        setStatusMessage(
          result.message || "Failed to send reset email. Please try again."
        );

        toast({
          title: "Error",
          description:
            result.message || "Failed to send reset email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setResetStatus("error");
      setStatusMessage("An error occurred. Please try again.");

      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
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
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {submitted
              ? "Check your email for reset instructions"
              : "Enter your email to receive a password reset link"}
          </CardDescription>
        </CardHeader>

        {resetStatus !== "idle" && (
          <div className="px-6 pb-4">
            <Alert
              variant={resetStatus === "success" ? "default" : "destructive"}
              className="flex items-center"
            >
              <div className="flex-shrink-0 mr-2">
                {resetStatus === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div>
                <AlertTitle className="text-sm font-medium">
                  {resetStatus === "success" ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {statusMessage}
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}

        {!submitted ? (
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              We've sent an email to <strong>{email}</strong> with instructions
              to reset your password.
            </p>
            <p className="text-muted-foreground">
              Please check your inbox and spam folder.
            </p>
            <Button className="mt-4" onClick={() => router.push("/login")}>
              Return to login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
