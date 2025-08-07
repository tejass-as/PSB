"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LogEntry } from "@/lib/log-simulator"
import { BarChart3, TrendingUp, Activity, PieChart, Target } from "lucide-react"
import { motion } from "framer-motion"

interface LogChartProps {
  logs: LogEntry[]
  stats: {
    totalLogs: number
    threatsDetected: number
    activeConnections: number
    systemHealth: number
    resolvedThreats: number
    avgResponseTime: number
  }
}

export function LogChart({ logs, stats }: LogChartProps) {
  const severityCounts = logs.reduce(
    (acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const sourceCounts = logs.reduce(
    (acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSourceColor = (index: number) => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500"]
    return colors[index % colors.length]
  }

  const maxSeverityCount = Math.max(...Object.values(severityCounts), 1)
  const maxSourceCount = Math.max(...Object.values(sourceCounts), 1)

  const threatDetectionRate = stats.totalLogs > 0 ? ((stats.threatsDetected / stats.totalLogs) * 100).toFixed(1) : "0"
  const resolutionRate =
    stats.threatsDetected > 0 ? ((stats.resolvedThreats / stats.threatsDetected) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -2 }}>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Detection Rate</p>
                  <motion.p
                    key={threatDetectionRate}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-blue-700 dark:text-blue-300"
                  >
                    {threatDetectionRate}%
                  </motion.p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Resolution Rate</p>
                  <motion.p
                    key={resolutionRate}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-green-700 dark:text-green-300"
                  >
                    {resolutionRate}%
                  </motion.p>
                </div>
                <PieChart className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg Response</p>
                  <motion.p
                    key={stats.avgResponseTime}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-purple-700 dark:text-purple-300"
                  >
                    {stats.avgResponseTime.toFixed(1)}s
                  </motion.p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">System Health</p>
                  <motion.p
                    key={Math.floor(stats.systemHealth)}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-orange-700 dark:text-orange-300"
                  >
                    {Math.floor(stats.systemHealth)}%
                  </motion.p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Severity Distribution
            </CardTitle>
            <CardDescription>Log entries by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(severityCounts).map(([severity, count], index) => (
                <motion.div
                  key={severity}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-20 text-sm font-medium capitalize">{severity}</div>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxSeverityCount) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full ${getSeverityColor(severity)} rounded-full`}
                    />
                  </div>
                  <div className="w-12 text-sm font-semibold text-right">{count}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-500" />
              Source Distribution
            </CardTitle>
            <CardDescription>Log entries by source system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(sourceCounts).map(([source, count], index) => (
                <motion.div
                  key={source}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-20 text-sm font-medium capitalize">{source}</div>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxSourceCount) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full ${getSourceColor(index)} rounded-full`}
                    />
                  </div>
                  <div className="w-12 text-sm font-semibold text-right">{count}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
