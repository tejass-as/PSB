"use client"

import { motion } from "framer-motion"
import { Shield, Activity, AlertTriangle, Server } from "lucide-react"

export function LoadingDashboard() {
  const icons = [Shield, Activity, AlertTriangle, Server]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="mb-8">
          <div className="p-4 bg-slate-800 dark:bg-slate-700 rounded-full inline-block">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4"
        >
          SecureWatch AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-8"
        >
          Initializing automated threat detection system...
        </motion.p>

        <div className="flex justify-center space-x-4 mb-8">
          {icons.map((Icon, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 0.2,
                }}
                className="p-3 bg-muted rounded-lg"
              >
                <Icon className="h-6 w-6 text-muted-foreground" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-64 mx-auto"
        >
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-slate-700 dark:bg-slate-600 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
