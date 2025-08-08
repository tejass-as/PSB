"use client"

import { useState, useEffect } from "react"
import { Dashboard } from "@/components/dashboard"
import { LoadingDashboard } from "@/components/loading-dashboard"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {isLoading ? <LoadingDashboard /> : <Dashboard />}
      </div>
    </ThemeProvider>
  )
}
