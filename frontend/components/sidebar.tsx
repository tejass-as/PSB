"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ThreatAlert } from "@/lib/log-simulator"
import {
  Shield,
  Activity,
  AlertTriangle,
  Users,
  Server,
  Play,
  Square,
  Zap,
  RotateCcw,
  CheckCircle,
  Download,
  X,
  Clock,
  Check,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SidebarProps {
  stats: {
    totalLogs: number
    threatsDetected: number
    activeConnections: number
    systemHealth: number
    resolvedThreats: number
    avgResponseTime: number
  }
  threats: ThreatAlert[]
  isGenerating: boolean
  onToggleGeneration: () => void
  onSimulateAttack: () => void
  onReset: () => void
  onResolveThreats: () => void
  onResolveThreat: (threatId: string) => void
  onExportLogs: () => void
  onClose: () => void
}

export function Sidebar({
  stats,
  threats,
  isGenerating,
  onToggleGeneration,
  onSimulateAttack,
  onReset,
  onResolveThreats,
  onResolveThreat,
  onExportLogs,
  onClose,
}: SidebarProps) {
  const statCards = [
    {
      title: "Total Logs",
      value: stats.totalLogs.toLocaleString(),
      icon: Activity,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-white/95 dark:bg-slate-800/95",
      borderColor: "border-slate-200 dark:border-slate-700",
    },
    {
      title: "Active Threats",
      value: threats.length,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-white/95 dark:bg-slate-800/95",
      borderColor: "border-slate-200 dark:border-slate-700",
      pulse: threats.length > 0,
    },
    {
      title: "Resolved Threats",
      value: stats.resolvedThreats,
      icon: CheckCircle,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-white/95 dark:bg-slate-800/95",
      borderColor: "border-slate-200 dark:border-slate-700",
    },
    {
      title: "Connections",
      value: stats.activeConnections,
      icon: Users,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-white/95 dark:bg-slate-800/95",
      borderColor: "border-slate-200 dark:border-slate-700",
    },
    {
      title: "System Health",
      value: `${Math.floor(stats.systemHealth)}%`,
      icon: Server,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-white/95 dark:bg-slate-800/95",
      borderColor: "border-slate-200 dark:border-slate-700",
    },
    {
      title: "Avg Response",
      value: `${stats.avgResponseTime.toFixed(1)}s`,
      icon: Clock,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-white/95 dark:bg-slate-800/95",
      borderColor: "border-slate-200 dark:border-slate-700",
    },
  ]

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-80 h-screen bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 shadow-sm flex flex-col fixed left-0 top-0 z-50 lg:sticky lg:top-0"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 dark:bg-slate-700 rounded-xl shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">Control Center</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">System Overview</p>
            </div>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className={`w-2 h-2 rounded-full ${isGenerating ? "bg-slate-600" : "bg-slate-400"}`}
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isGenerating ? "System Active" : "System Idle"}
          </span>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            System Metrics
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`relative overflow-hidden rounded-xl border p-3 transition-all shadow-sm ${stat.bgColor} ${stat.borderColor}`}
              >
                {stat.pulse && (
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-red-500 rounded-xl"
                  />
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    {stat.title === "Active Threats" && threats.length > 0 && (
                      <Badge className="text-xs animate-pulse bg-red-600 hover:bg-red-700 text-white">Alert</Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <motion.div
                      key={stat.value}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-xl font-bold text-slate-800 dark:text-slate-200"
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{stat.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <Separator className="my-6 bg-slate-200 dark:bg-slate-700" />

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Quick Actions
            </h3>

            <div className="space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onToggleGeneration}
                  variant={isGenerating ? "destructive" : "default"}
                  className="w-full justify-start shadow-sm"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Generation
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Generation
                    </>
                  )}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onSimulateAttack}
                  variant="outline"
                  className="w-full justify-start shadow-sm bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Simulate Attack
                </Button>
              </motion.div>

              {threats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={onResolveThreats}
                    variant="outline"
                    className="w-full justify-start shadow-sm border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/20 bg-white/80 dark:bg-slate-700/80"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-slate-600 dark:text-slate-400" />
                    Resolve All Threats
                  </Button>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onExportLogs}
                  variant="outline"
                  className="w-full justify-start shadow-sm bg-white/80 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onReset}
                  variant="outline"
                  className="w-full justify-start shadow-sm border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/20 bg-white/80 dark:bg-slate-700/80"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2 text-slate-600 dark:text-slate-400" />
                  Reset System
                </Button>
              </motion.div>
            </div>
          </div>

          <Separator className="my-6 bg-slate-200 dark:bg-slate-700" />

          {/* Recent Threats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Recent Threats
              </h3>
              {threats.length > 0 && (
                <Badge className="text-xs animate-pulse bg-red-500 hover:bg-red-600 text-white">{threats.length}</Badge>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              <AnimatePresence>
                {threats.slice(0, 5).map((threat, index) => (
                  <motion.div
                    key={threat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-xl shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1">
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
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-red-700 dark:text-red-300 truncate">
                            {threat.type}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400 truncate">{threat.ip}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {threat.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onResolveThreat(threat.id)}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Resolve threat"
                      >
                        <Check className="h-3 w-3 text-green-500" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {threats.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
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
                    <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  </motion.div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">All Clear</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">No active threats</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Last updated</span>
          <motion.span key={Date.now()} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {new Date().toLocaleTimeString()}
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}
