"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { SiteHeader } from "@/components/dashboard/site-header"
import { dashboardConfig } from "@/config/dashboard"
import { getCurrentUser, authStorage } from "@/lib/api-service"

interface DashboardShellProps {
  children?: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // This effect runs only on the client side
  useEffect(() => {
    setIsClient(true)

    // Check if user is authenticated
    const checkAuth = async () => {
      setIsLoading(true)

      // First check local storage for faster response
      if (authStorage.isAuthenticated()) {
        setIsLoading(false)
        return
      }

      try {
        // Then try API
        const data = await getCurrentUser()
        if (data.user) {
          authStorage.setUser(data.user)
          setIsLoading(false)
        } else {
          // No authenticated user found
          const message = encodeURIComponent("Please log in to access the dashboard")
          router.push(`/login?status=error&message=${message}`)
        }
      } catch (err) {
        console.log("Auth check failed:", err)

        // If API check fails but we have local storage auth, allow access
        if (authStorage.isAuthenticated()) {
          setIsLoading(false)
        } else {
          const message = encodeURIComponent("Authentication failed. Please log in again.")
          router.push(`/login?status=error&message=${message}`)
        }
      }
    }

    checkAuth()
  }, [router])

  // Don't render anything during SSR or if still loading
  if (!isClient || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Get the current page title from the pathname
  const getPageTitle = () => {
    const path = pathname.split("/").pop() || "dashboard"
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <DashboardNav items={dashboardConfig.sidebarNav} />
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h2>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
