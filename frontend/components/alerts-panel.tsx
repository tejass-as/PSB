"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { LogEntry, ThreatAlert } from "@/lib/log-simulator"
import { AlertTriangle, Shield, CheckCircle, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface AlertsPanelProps {
  threats: ThreatAlert[]
  onResolveAll: () => void
  onResolveThreat: (threatId: string) => void
  onThreatClick: (threat: ThreatAlert) => void
  logs: LogEntry[]
}

export function AlertsPanel({ threats, onResolveAll, onResolveThreat, onThreatClick, logs }: AlertsPanelProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "medium":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Shield className="h-5 w-5 text-blue-500" />
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700"
      case "high":
        return "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700"
      case "medium":
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700"
      default:
        return "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700"
    }
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Threat Alerts
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Active security threats requiring attention
            </CardDescription>
          </div>
          {threats.length > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onResolveAll}
                variant="outline"
                size="sm"
                className="bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve All
              </Button>
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
          <AnimatePresence>
            {threats.map((threat, index) => (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${getSeverityBg(threat.severity)}`}
                onClick={() => onThreatClick(threat)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    >
                      {getSeverityIcon(threat.severity)}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{threat.source}</h3>
                        <Badge
                          className={`text-xs animate-pulse ${
                            threat.severity === "critical"
                              ? "bg-red-600 hover:bg-red-700"
                              : threat.severity === "high"
                              ? "bg-orange-600 hover:bg-orange-700"
                              : threat.severity === "medium"
                              ? "bg-yellow-600 hover:bg-yellow-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          } text-white`}
                        >
                          {threat.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{threat.description}</p>
                      {threat.explanation && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic mb-2 border-l-2 border-slate-300 dark:border-slate-600 pl-2">
                          {threat.explanation}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>IP: {threat.ip}</span>
                        <span>{threat.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onResolveThreat(threat.id)}
                    className="ml-2 p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Resolve this threat"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {threats.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <Shield className="h-16 w-16 mx-auto mb-4 text-green-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">All Clear!</h3>
              <p className="text-slate-600 dark:text-slate-400">No active threats detected</p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
