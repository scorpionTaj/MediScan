import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

function LoginPageContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm />
    </div>
  );
}

function LoginPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-4">
        <div className="h-8 w-3/4 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}
