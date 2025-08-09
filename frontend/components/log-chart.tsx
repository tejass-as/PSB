"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LogEntry } from "@/lib/log-simulator";
import {
  BarChart3,
  TrendingUp,
  Activity,
  PieChart,
  Target,
  LineChart,
  BarChart,
  PieChart as PieChartIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
} from "recharts";

interface LogChartProps {
  logs: LogEntry[];
  stats: {
    totalLogs: number;
    threatsDetected: number;
    activeConnections: number;
    systemHealth: number;
    resolvedThreats: number;
    avgResponseTime: number;
  };
}

export function LogChart({ logs, stats }: LogChartProps) {
  const severityCounts = logs.reduce((acc, log) => {
    acc[log.severity] = (acc[log.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceCounts = logs.reduce((acc, log) => {
    acc[log.source] = (acc[log.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#dc2626"; // red-600
      case "high":
        return "#ea580c"; // orange-600
      case "medium":
        return "#d97706"; // amber-600
      case "low":
        return "#059669"; // emerald-600
      default:
        return "#64748b"; // slate-500
    }
  };

  const getSourceColor = (index: number) => {
    const colors = [
      "#64748b", // slate-500
      "#3b82f6", // blue-500
      "#6366f1", // indigo-500
      "#14b8a6", // teal-500
      "#8b5cf6", // violet-500
    ];
    return colors[index % colors.length];
  };

  const maxSeverityCount = Math.max(...Object.values(severityCounts), 1);
  const maxSourceCount = Math.max(...Object.values(sourceCounts), 1);

  const threatDetectionRate =
    stats.totalLogs > 0
      ? ((stats.threatsDetected / stats.totalLogs) * 100).toFixed(1)
      : "0";
  const resolutionRate =
    stats.threatsDetected > 0
      ? ((stats.resolvedThreats / stats.threatsDetected) * 100).toFixed(1)
      : "0";

  // Prepare data for charts
  const severityData = Object.entries(severityCounts).map(([severity, count]) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count,
    color: getSeverityColor(severity),
  }));

  const sourceData = Object.entries(sourceCounts).map(([source, count], index) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count,
    color: getSourceColor(index),
  }));

  // Time series data for trends (last 10 logs)
  const timeSeriesData = logs.slice(0, 10).reverse().map((log, index) => ({
    time: index + 1,
    severity: log.severity === "critical" ? 4 : log.severity === "high" ? 3 : log.severity === "medium" ? 2 : 1,
    source: log.source,
  }));

  // Performance metrics data
  const performanceData = [
    {
      name: "Detection Rate",
      value: parseFloat(threatDetectionRate),
      target: 95,
      color: "#3b82f6",
    },
    {
      name: "Resolution Rate",
      value: parseFloat(resolutionRate),
      target: 90,
      color: "#10b981",
    },
    {
      name: "System Health",
      value: Math.floor(stats.systemHealth),
      target: 98,
      color: "#f59e0b",
    },
    {
      name: "Response Time",
      value: stats.avgResponseTime * 100, // Convert to percentage for visualization
      target: 80,
      color: "#8b5cf6",
    },
  ];

  // Area chart data for system health over time
  const healthData = Array.from({ length: 20 }, (_, i) => ({
    time: i + 1,
    health: Math.max(85, Math.min(99, stats.systemHealth + (Math.random() - 0.5) * 10)),
    threats: Math.floor(Math.random() * 5),
  }));

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators with Mini Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Detection Rate
                  </p>
                  <motion.p
                    key={threatDetectionRate}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    {threatDetectionRate}%
                  </motion.p>
                </div>
                <Target className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
              {/* Mini Line Chart */}
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthData.slice(-8)}>
                    <Area
                      type="monotone"
                      dataKey="health"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Resolution Rate
                  </p>
                  <motion.p
                    key={resolutionRate}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    {resolutionRate}%
                  </motion.p>
                </div>
                <PieChart className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
              {/* Mini Pie Chart */}
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Resolved", value: parseFloat(resolutionRate) },
                        { name: "Pending", value: 100 - parseFloat(resolutionRate) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={25}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
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
          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Avg Response
                  </p>
                  <motion.p
                    key={stats.avgResponseTime}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    {stats.avgResponseTime.toFixed(1)}s
                  </motion.p>
                </div>
                <Activity className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
              {/* Mini Bar Chart */}
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={[{ name: "Response", value: stats.avgResponseTime * 10 }]}>
                    <Bar dataKey="value" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
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
          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    System Health
                  </p>
                  <motion.p
                    key={Math.floor(stats.systemHealth)}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    {Math.floor(stats.systemHealth)}%
                  </motion.p>
                </div>
                <TrendingUp className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
              {/* Mini Line Chart */}
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={healthData.slice(-8)}>
                    <Line
                      type="monotone"
                      dataKey="health"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution - Enhanced Bar Chart */}
        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-slate-600 dark:text-slate-400" />
              Severity Distribution
            </CardTitle>
            <CardDescription>Log entries by severity level with trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution - Enhanced Pie Chart */}
        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-slate-600 dark:text-slate-400" />
              Source Distribution
            </CardTitle>
            <CardDescription>Log entries by source system with percentage breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Dashboard */}
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-slate-600 dark:text-slate-400" />
            Performance Metrics Dashboard
          </CardTitle>
          <CardDescription>Real-time performance indicators and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="target" radius={[4, 4, 0, 0]} fill="rgba(0,0,0,0.1)">
                  {performanceData.map((entry, index) => (
                    <Cell key={`target-${index}`} fill="rgba(0,0,0,0.1)" />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* System Health Trend */}
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-slate-600 dark:text-slate-400" />
            System Health Trend
          </CardTitle>
          <CardDescription>System health and threat count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="health"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="threats"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
