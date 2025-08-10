"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LogEntry } from "@/lib/log-simulator";
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  Globe,
  AlertTriangle,
  Shield,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogTableProps {
  logs: LogEntry[];
}

export function LogTable({ logs }: LogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" || log.severity === severityFilter;
    const matchesSource = sourceFilter === "all" || log.source === sourceFilter;

    return matchesSearch && matchesSeverity && matchesSource;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white hover:bg-red-700";
      case "high":
        return "bg-orange-600 text-white hover:bg-orange-700";
      case "medium":
        return "bg-amber-600 text-white hover:bg-amber-700";
      case "low":
        return "bg-emerald-600 text-white hover:bg-emerald-700";
      default:
        return "bg-slate-600 text-white hover:bg-slate-700";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-3 w-3" />;
      case "high":
        return <Shield className="h-3 w-3" />;
      case "medium":
        return <Activity className="h-3 w-3" />;
      case "low":
        return <Eye className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30";
      case "high":
        return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/30";
      case "medium":
        return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/30";
      case "low":
        return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/30";
      default:
        return "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-950/30";
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
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

  const sourceCounts = logs.reduce((acc, log) => {
    acc[log.source] = (acc[log.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="h-full border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Security Logs
            </CardTitle>
            <CardDescription>
              Real-time log monitoring and analysis with advanced filtering
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search logs, IP, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.keys(sourceCounts).map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={exportLogs}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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
                className={`p-4 rounded-xl border transition-all hover:shadow-md ${getSeverityBg(
                  log.severity
                )}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge
                        className={`${getSeverityColor(
                          log.severity
                        )} flex items-center gap-1`}
                      >
                        {getSeverityIcon(log.severity)}
                        {log.severity.toUpperCase()}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs bg-white/50 dark:bg-slate-800/50"
                      >
                        {log.source}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(log.timestamp)}
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-2 text-slate-900 dark:text-slate-100">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>{log.ip}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.user}</span>
                      </div>
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
              className="text-center py-12 text-slate-500 dark:text-slate-400"
            >
              <Filter className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No logs found</p>
              <p className="text-sm">
                Try adjusting your search criteria or filters
              </p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
