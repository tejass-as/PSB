"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Server, Cpu, HardDrive, Wifi, Database, Shield } from "lucide-react"
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
      color: "text-green-500",
    },
    {
      name: "Threat Detection",
      status: "operational",
      uptime: "99.8%",
      icon: Shield,
      color: "text-green-500",
    },
    {
      name: "Network Monitor",
      status: "operational",
      uptime: "99.7%",
      icon: Wifi,
      color: "text-green-500",
    },
    {
      name: "Storage System",
      status: "warning",
      uptime: "98.5%",
      icon: HardDrive,
      color: "text-yellow-500",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Operational</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Warning</Badge>
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2 text-blue-500" />
            System Components
          </CardTitle>
          <CardDescription>Status of core system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemComponents.map((component, index) => (
              <motion.div
                key={component.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <component.icon className={`h-5 w-5 ${component.color}`} />
                  <div>
                    <div className="font-medium">{component.name}</div>
                    <div className="text-sm text-muted-foreground">Uptime: {component.uptime}</div>
                  </div>
                </div>
                {getStatusBadge(component.status)}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="h-5 w-5 mr-2 text-purple-500" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Real-time system performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">System Health</span>
                <span className="text-sm text-muted-foreground">{Math.floor(stats.systemHealth)}%</span>
              </div>
              <Progress value={stats.systemHealth} className="h-2" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-muted-foreground">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Network I/O</span>
                <span className="text-sm text-muted-foreground">23%</span>
              </div>
              <Progress value={23} className="h-2" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
