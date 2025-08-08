"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { LogEntry } from "@/lib/log-simulator"
import { Search, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface LogTableProps {
  logs: LogEntry[]
}

export function LogTable({ logs }: LogTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLogs = logs.filter(
    (log) =>
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm),
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      case "high":
        return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
      case "medium":
        return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
      case "low":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
      default:
        return "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800"
    }
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Security Logs</CardTitle>
            <CardDescription>Real-time log monitoring and analysis</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
          <AnimatePresence>
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border transition-all hover:shadow-sm ${getSeverityBg(log.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={getSeverityColor(log.severity)} className="text-xs">
                        {log.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-medium mb-1">{log.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>IP: {log.ip}</span>
                      <span>User: {log.user}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredLogs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No logs found matching your search criteria</p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
