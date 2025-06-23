"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="h-8 w-8 mr-3">
              <img
                src="/images/mediscan-logo.png"
                alt="MediScan Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">MediScan</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            <NavItem
              icon={<Home className="mr-3 h-5 w-5" />}
              label="Home"
              href="/"
            />
            <NavItem
              icon={<LayoutDashboard className="mr-3 h-5 w-5" />}
              label="Dashboard"
              href="/"
              active
            />
            <NavItem
              icon={<FileText className="mr-3 h-5 w-5" />}
              label="Reports"
              href="#"
            />
            <NavItem
              icon={<Users className="mr-3 h-5 w-5" />}
              label="Patients"
              href="#"
            />
            <NavItem
              icon={<Settings className="mr-3 h-5 w-5" />}
              label="Settings"
              href="#"
            />
          </nav>
          <div className="px-2 mt-6">
            <Button
              variant="outline"
              className="w-full justify-start text-gray-500"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden absolute top-4 left-4"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between px-4 py-5 border-b">
              <div className="flex items-center">
                <div className="h-8 w-8 mr-3">
                  <img
                    src="/images/mediscan-logo.png"
                    alt="MediScan Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <h1 className="text-xl font-semibold text-gray-800">
                  MediScan
                </h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
              <NavItem
                icon={<Home className="mr-3 h-5 w-5" />}
                label="Home"
                href="/"
              />
              <NavItem
                icon={<LayoutDashboard className="mr-3 h-5 w-5" />}
                label="Dashboard"
                href="/"
                active
              />
              <NavItem
                icon={<FileText className="mr-3 h-5 w-5" />}
                label="Reports"
                href="#"
              />
              <NavItem
                icon={<Users className="mr-3 h-5 w-5" />}
                label="Patients"
                href="#"
              />
              <NavItem
                icon={<Settings className="mr-3 h-5 w-5" />}
                label="Settings"
                href="#"
              />
            </nav>
            <div className="px-2 py-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start text-gray-500"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800 hidden md:block">
              Dashboard
            </h1>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-3 hidden sm:block">
                Dr. Sarah Johnson
              </span>
              <Avatar>
                <AvatarImage
                  src="/placeholder-user.jpg"
                  alt="Dr. Sarah Johnson"
                />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
        active
          ? "bg-teal-50 text-teal-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
