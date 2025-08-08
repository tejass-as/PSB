"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Sidebar } from "@/components/sidebar";
import { LogTable } from "@/components/log-table";
import { AlertsPanel } from "@/components/alerts-panel";
import { ThreatChatbot } from "@/components/threat-chatbot";
import { LogChart } from "@/components/log-chart";
import { SystemStatus } from "@/components/system-status";
import { VoiceNotification } from "@/components/voice-notification";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  generateLog,
  detectThreat,
  type LogEntry,
  type ThreatAlert,
} from "@/lib/log-simulator";
import {
  Shield,
  Menu,
  X,
  Settings,
  Download,
  Bell,
  Volume2,
  Mail,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [threats, setThreats] = useState<ThreatAlert[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("logs");
  const [settings, setSettings] = useState({
    voiceAlerts: true,
    emailNotifications: false,
    browserNotifications: true,
    alertThreshold: "medium",
    voiceVolume: 80,
    autoResolve: false,
  });
  const [stats, setStats] = useState({
    totalLogs: 0,
    threatsDetected: 0,
    activeConnections: 0,
    systemHealth: 98,
    resolvedThreats: 0,
    avgResponseTime: 0.8,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        const newLog = generateLog();
        setLogs((prev) => [newLog, ...prev.slice(0, 199)]);

        const threat = detectThreat(newLog);
        if (threat) {
          setThreats((prev) => [threat, ...prev]);
        }

        setStats((prev) => ({
          totalLogs: prev.totalLogs + 1,
          threatsDetected: threat
            ? prev.threatsDetected + 1
            : prev.threatsDetected,
          activeConnections: Math.floor(Math.random() * 50) + 100,
          systemHealth: Math.max(
            85,
            Math.min(99, prev.systemHealth + (Math.random() - 0.5) * 2)
          ),
          resolvedThreats: prev.resolvedThreats,
          avgResponseTime: Math.max(
            0.1,
            Math.min(2.0, prev.avgResponseTime + (Math.random() - 0.5) * 0.1)
          ),
        }));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const simulateAttack = () => {
    const attackLogs = [
      generateLog("failed_login", "192.168.1.100"),
      generateLog("failed_login", "192.168.1.100"),
      generateLog("failed_login", "192.168.1.100"),
      generateLog("intrusion_attempt", "192.168.1.100"),
      generateLog("malware_detected", "192.168.1.100"),
    ];

    attackLogs.forEach((log, index) => {
      setTimeout(() => {
        setLogs((prev) => [log, ...prev.slice(0, 199)]);
        const threat = detectThreat(log);
        if (threat) {
          setThreats((prev) => [threat, ...prev]);
        }
      }, index * 300);
    });
  };

  const resetSystem = () => {
    setLogs([]);
    setThreats([]);
    setIsGenerating(false);
    setStats({
      totalLogs: 0,
      threatsDetected: 0,
      activeConnections: 0,
      systemHealth: 98,
      resolvedThreats: 0,
      avgResponseTime: 0.8,
    });
  };

  const resolveAllThreats = () => {
    setStats((prev) => ({
      ...prev,
      resolvedThreats: prev.resolvedThreats + threats.length,
    }));
    setThreats([]);
  };

  const resolveThreat = (threatId: string) => {
    setThreats((prev) => prev.filter((threat) => threat.id !== threatId));
    setStats((prev) => ({
      ...prev,
      resolvedThreats: prev.resolvedThreats + 1,
    }));
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `security-logs-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex">
      <VoiceNotification threats={threats} settings={settings} />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="lg:relative lg:translate-x-0"
          >
            <Sidebar
              stats={stats}
              threats={threats}
              isGenerating={isGenerating}
              onToggleGeneration={() => setIsGenerating(!isGenerating)}
              onSimulateAttack={simulateAttack}
              onReset={resetSystem}
              onResolveThreats={resolveAllThreats}
              onResolveThreat={resolveThreat}
              onExportLogs={exportLogs}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:ml-0" : ""
        }`}
      >
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm"
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors lg:hidden"
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </motion.button>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3"
                >
                  <div className="p-3 bg-slate-800 dark:bg-slate-700 rounded-xl shadow-sm">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      SecureWatch AI
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Advanced Threat Detection System
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center space-x-4">
                <AnimatePresence>
                  {threats.length > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="relative"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(239, 68, 68, 0.4)",
                            "0 0 0 10px rgba(239, 68, 68, 0)",
                            "0 0 0 0 rgba(239, 68, 68, 0)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      >
                        <Badge className="bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-sm">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {threats.length} Active Threats
                        </Badge>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center space-x-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setActiveTab("settings")}
                      variant="outline"
                      size="sm"
                      className="shadow-sm border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </motion.div>

                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Dashboard Content */}
        <div className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-shrink-0"
              >
                <TabsList className="grid w-full grid-cols-5 lg:w-[500px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-700">
                  <TabsTrigger
                    value="logs"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                  >
                    Logs
                  </TabsTrigger>
                  <TabsTrigger
                    value="threats"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                  >
                    Threats
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                  >
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="system"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                  >
                    System
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="logs" className="space-y-6">
                    <LogTable logs={logs} />
                  </TabsContent>

                  <TabsContent value="threats" className="h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                      <AlertsPanel
                        threats={threats}
                        onResolveAll={resolveAllThreats}
                        onResolveThreat={resolveThreat}
                      />
                      <div className="h-full">
                        <ThreatChatbot
                          threats={threats}
                          onResolveThreat={resolveThreat}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-6">
                    <LogChart logs={logs} stats={stats} />
                  </TabsContent>

                  <TabsContent value="system" className="space-y-6">
                    <SystemStatus stats={stats} />
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* System Controls */}
                      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-2 mb-6">
                            <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                              System Controls
                            </h3>
                          </div>
                          <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <div>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  Auto-generate logs
                                </span>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Automatically generate security logs
                                </p>
                              </div>
                              <Switch
                                checked={isGenerating}
                                onCheckedChange={setIsGenerating}
                                className="data-[state=checked]:bg-slate-700 data-[state=checked]:dark:bg-white/60"
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <div>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  Auto-resolve threats
                                </span>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Automatically resolve low-priority threats
                                </p>
                              </div>
                              <Switch
                                checked={settings.autoResolve}
                                onCheckedChange={(checked) =>
                                  updateSetting("autoResolve", checked)
                                }
                                className="data-[state=checked]:bg-slate-700 data-[state=checked]:dark:bg-white/60"
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center space-x-3">
                                  <Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    Export logs
                                  </span>
                                </div>
                                <Button
                                  onClick={exportLogs}
                                  size="sm"
                                  className="bg-slate-700 hover:bg-slate-800 text-white shadow-sm"
                                >
                                  Export
                                </Button>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center space-x-3">
                                  <RotateCcw className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    Reset system
                                  </span>
                                </div>
                                <Button
                                  onClick={resetSystem}
                                  size="sm"
                                  className="bg-slate-700 hover:bg-slate-800 text-white shadow-sm"
                                >
                                  Reset All
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Notification Settings */}
                      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-2 mb-6">
                            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                              Notification Settings
                            </h3>
                          </div>
                          <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <Volume2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <div>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    Voice alerts
                                  </span>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Enable voice notifications for threats
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={settings.voiceAlerts}
                                onCheckedChange={(checked) =>
                                  updateSetting("voiceAlerts", checked)
                                }
                                className="data-[state=checked]:bg-slate-700 data-[state=checked]:dark:bg-white/60"
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <div>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    Email notifications
                                  </span>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Send email alerts for critical threats
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={settings.emailNotifications}
                                onCheckedChange={(checked) =>
                                  updateSetting("emailNotifications", checked)
                                }
                                className="data-[state=checked]:bg-slate-700 data-[state=checked]:dark:bg-white/60"
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <div>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    Browser notifications
                                  </span>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Show browser notifications
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={settings.browserNotifications}
                                onCheckedChange={(checked) =>
                                  updateSetting("browserNotifications", checked)
                                }
                                className="data-[state=checked]:bg-slate-700 data-[state=checked]:dark:bg-white/60"
                              />
                            </div>

                            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <Volume2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <label className="font-medium text-slate-800 dark:text-slate-200">
                                  Voice Volume
                                </label>
                              </div>
                              <Slider
                                value={[settings.voiceVolume]}
                                onValueChange={(value) =>
                                  updateSetting("voiceVolume", value[0])
                                }
                                max={100}
                                step={10}
                                className="w-full"
                              />
                              <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
                                Current: {settings.voiceVolume}%
                              </div>
                            </div>

                            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <AlertTriangle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <label className="font-medium text-slate-800 dark:text-slate-200">
                                  Alert Threshold
                                </label>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {["low", "medium", "high", "critical"].map(
                                  (level) => (
                                    <Button
                                      key={level}
                                      onClick={() =>
                                        updateSetting("alertThreshold", level)
                                      }
                                      variant={
                                        settings.alertThreshold === level
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      className={`capitalize ${
                                        settings.alertThreshold === level
                                          ? `bg-slate-600 hover:bg-slate-700 text-white border-l-4 ${
                                              level === "critical"
                                                ? "border-red-500"
                                                : level === "high"
                                                ? "border-orange-500"
                                                : level === "medium"
                                                ? "border-amber-500"
                                                : "border-green-500"
                                            }`
                                          : "bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      {level}
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
