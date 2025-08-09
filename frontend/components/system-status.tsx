"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Server, Cpu, HardDrive, Wifi, Database, Shield, Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

interface SystemStatusProps {
  stats: {
    totalLogs: number
    threatsDetected: number
    activeConnections: number
    systemHealth: number
  }
}

export function SystemStatus({ stats }: SystemStatusProps) {
  const systemComponents = [
    {
      name: "Log Ingestion",
      status: "operational",
      uptime: "99.9%",
      icon: Database,
      color: "text-slate-600 dark:text-slate-400",
      description: "Processing security logs in real-time"
    },
    {
      name: "Threat Detection",
      status: "operational",
      uptime: "99.8%",
      icon: Shield,
      color: "text-slate-600 dark:text-slate-400",
      description: "Analyzing threats and security events"
    },
    {
      name: "Network Monitor",
      status: "operational",
      uptime: "99.7%",
      icon: Wifi,
      color: "text-slate-600 dark:text-slate-400",
      description: "Monitoring network traffic and connections"
    },
    {
      name: "Storage System",
      status: "warning",
      uptime: "98.5%",
      icon: HardDrive,
      color: "text-slate-600 dark:text-slate-400",
      description: "Managing data storage and retention"
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Operational
        </Badge>
      case "warning":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      case "critical":
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95"
      case "warning":
        return "border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20"
      case "critical":
        return "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20"
      default:
        return "border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Components */}
        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-slate-800 dark:bg-slate-700 rounded-lg">
                <Server className="h-5 w-5 text-white" />
              </div>
              System Components
            </CardTitle>
            <CardDescription>Status of core system components and services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemComponents.map((component, index) => (
                <motion.div
                  key={component.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${getStatusColor(component.status)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-700 dark:bg-slate-600 rounded-lg">
                      <component.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{component.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{component.description}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Uptime: {component.uptime}</div>
                    </div>
                  </div>
                  {getStatusBadge(component.status)}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-slate-800 dark:bg-slate-700 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Performance Metrics
            </CardTitle>
            <CardDescription>Real-time system performance data and resource usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">System Health</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{Math.floor(stats.systemHealth)}%</span>
                </div>
                <div className="relative">
                  <Progress value={stats.systemHealth} className="h-3" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full opacity-20"></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">CPU Usage</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">45%</span>
                </div>
                <div className="relative">
                  <Progress value={45} className="h-3" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full opacity-20"></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Memory Usage</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">67%</span>
                </div>
                <div className="relative">
                  <Progress value={67} className="h-3" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full opacity-20"></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Network I/O</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">23%</span>
                </div>
                <div className="relative">
                  <Progress value={23} className="h-3" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full opacity-20"></div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
