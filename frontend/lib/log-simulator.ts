export interface LogEntry {
  id: string
  timestamp: Date
  source: string
  severity: "low" | "medium" | "high" | "critical"
  message: string
  ip: string
  user: string
}

export interface ThreatAlert {
  id: string
  timestamp: Date
  type: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  ip: string
}

const sources = ["firewall", "auth", "web", "database", "system", "network", "vpn"]
const users = ["admin", "user1", "user2", "guest", "service", "system", "api"]
const ips = [
  "192.168.1.100",
  "10.0.0.50",
  "172.16.0.25",
  "203.0.113.10",
  "198.51.100.5",
  "192.168.1.200",
  "10.0.0.75",
  "172.16.0.50",
]

const logMessages = {
  low: [
    "User login successful",
    "File access granted",
    "System backup completed",
    "Service started successfully",
    "Configuration updated",
    "Routine maintenance completed",
    "Cache cleared successfully",
    "Database connection established",
  ],
  medium: [
    "Multiple login attempts detected",
    "Unusual network traffic pattern",
    "Service restart required",
    "Memory usage high",
    "Disk space warning",
    "Connection timeout occurred",
    "Rate limit exceeded",
    "SSL certificate expiring soon",
  ],
  high: [
    "Failed login attempts exceeded threshold",
    "Suspicious file access detected",
    "Unauthorized access attempt",
    "Service failure detected",
    "Security policy violation",
    "Potential data exfiltration",
    "Privilege escalation attempt",
    "Suspicious network scan detected",
  ],
  critical: [
    "Potential intrusion detected",
    "System compromise suspected",
    "Data breach attempt",
    "Malware signature detected",
    "Critical service failure",
    "Ransomware activity detected",
    "Root access compromise",
    "Critical vulnerability exploited",
  ],
}

export function generateLog(forceType?: string, forceIp?: string): LogEntry {
  const severities: Array<"low" | "medium" | "high" | "critical"> = ["low", "medium", "high", "critical"]
  const weights = [0.5, 0.3, 0.15, 0.05] // Probability weights

  let severity: "low" | "medium" | "high" | "critical"

  if (forceType === "failed_login" || forceType === "intrusion_attempt" || forceType === "malware_detected") {
    severity = forceType === "intrusion_attempt" || forceType === "malware_detected" ? "critical" : "high"
  } else {
    const random = Math.random()
    let cumulative = 0
    severity = "low"

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (random <= cumulative) {
        severity = severities[i]
        break
      }
    }
  }

  const messages = logMessages[severity]
  let message = messages[Math.floor(Math.random() * messages.length)]

  if (forceType === "failed_login") {
    message = "Failed login attempt detected"
  } else if (forceType === "intrusion_attempt") {
    message = "Potential intrusion detected - multiple failed authentications"
  } else if (forceType === "malware_detected") {
    message = "Malware signature detected in network traffic"
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    source: sources[Math.floor(Math.random() * sources.length)],
    severity,
    message,
    ip: forceIp || ips[Math.floor(Math.random() * ips.length)],
    user: users[Math.floor(Math.random() * users.length)],
  }
}

export function detectThreat(log: LogEntry): ThreatAlert | null {
  // Enhanced threat detection logic
  const threatKeywords = [
    "failed",
    "intrusion",
    "breach",
    "malware",
    "compromise",
    "unauthorized",
    "suspicious",
    "exploit",
    "ransomware",
  ]
  const isHighSeverity = log.severity === "high" || log.severity === "critical"
  const containsThreatKeyword = threatKeywords.some((keyword) => log.message.toLowerCase().includes(keyword))

  if (isHighSeverity && containsThreatKeyword) {
    const threatTypes = {
      failed: "Brute Force Attack",
      intrusion: "Intrusion Attempt",
      breach: "Data Breach",
      malware: "Malware Detection",
      compromise: "System Compromise",
      unauthorized: "Unauthorized Access",
      suspicious: "Suspicious Activity",
      exploit: "Vulnerability Exploit",
      ransomware: "Ransomware Attack",
    }

    const detectedKeyword = threatKeywords.find((keyword) => log.message.toLowerCase().includes(keyword)) || "failed"

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: threatTypes[detectedKeyword as keyof typeof threatTypes],
      severity: log.severity,
      description: `Detected ${threatTypes[detectedKeyword as keyof typeof threatTypes].toLowerCase()} from ${log.source} system targeting ${log.user}`,
      ip: log.ip,
    }
  }

  return null
}
