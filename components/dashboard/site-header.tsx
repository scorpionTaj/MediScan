"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { dashboardConfig } from "@/config/dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/dashboard/user-nav";
import { authStorage } from "@/lib/api-service";

export function SiteHeader() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );

  useEffect(() => {
    const storedUser = authStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <div className="flex items-center space-x-2 mb-8">
              <img
                src="/images/mediscan-logo.png"
                alt="MediScan Logo"
                className="h-6 w-6 object-contain"
              />
              <span className="font-bold">MediScan</span>
            </div>
            <DashboardNav items={dashboardConfig.sidebarNav} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center space-x-2 md:mr-4">
          <img
            src="/images/mediscan-logo.png"
            alt="MediScan Logo"
            className="h-6 w-6 object-contain hidden md:block"
          />
          <Link href="/dashboard" className="hidden md:block font-bold">
            MediScan
          </Link>
        </div>
        <div className="flex-1" />
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {user && <UserNav user={user} />}
        </div>
      </div>
    </header>
  );
}
