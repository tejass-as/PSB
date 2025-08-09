interface KafkaLogData {
  timestamp: string
  log_type: string
  topic: string
  batch_info: {
    file_cycle: string
    batch_number: string
    record_in_batch: string
    batch_size: string
  }
  total_records_sent: string
  data: Record<string, any>
}

interface LogEntry {
  id: string
  timestamp: Date
  source: string
  severity: "low" | "medium" | "high" | "critical"
  message: string
  ip: string
  user: string
}

interface ThreatAlert {
  id: string
  timestamp: Date
  type: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  ip: string
}

export class KafkaService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private isConnected = false
  private messageHandlers: ((log: LogEntry) => void)[] = []
  private threatHandlers: ((threat: ThreatAlert) => void)[] = []

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      // Connect to WebSocket server that will proxy Kafka messages
      this.ws = new WebSocket('ws://localhost:8080/kafka')
      
      this.ws.onopen = () => {
        console.log('Connected to Kafka WebSocket')
        this.isConnected = true
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const kafkaData: KafkaLogData = JSON.parse(event.data)
          console.log('Received Kafka message:', kafkaData)
          //const logEntry = this.convertKafkaDataToLogEntry(kafkaData)
          
          //// Notify all message handlers
          //this.messageHandlers.forEach(handler => handler(logEntry))
          
          //// Check for threats
          //const threat = this.detectThreat(logEntry)
          //if (threat) {
          //  this.threatHandlers.forEach(handler => handler(threat))
          //}
        } catch (error) {
          console.error('Error parsing Kafka message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('Kafka WebSocket connection closed')
        this.isConnected = false
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('Kafka WebSocket error:', error)
        this.isConnected = false
      }
    } catch (error) {
      console.error('Failed to connect to Kafka WebSocket:', error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect to Kafka (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  private convertKafkaDataToLogEntry(kafkaData: KafkaLogData): LogEntry {
    // Convert Kafka data to LogEntry format
    const severity = this.determineSeverity(kafkaData)
    const source = kafkaData.log_type || 'unknown'
    const message = this.extractMessage(kafkaData)
    const ip = this.extractIP(kafkaData)
    const user = this.extractUser(kafkaData)

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(kafkaData.timestamp),
      source,
      severity,
      message,
      ip,
      user
    }
  }

  private determineSeverity(kafkaData: KafkaLogData): "low" | "medium" | "high" | "critical" {
    const data = kafkaData.data
    const message = JSON.stringify(data).toLowerCase()
    
    // Critical indicators
    if (message.includes('malware') || message.includes('breach') || message.includes('compromise') || 
        message.includes('ransomware') || message.includes('intrusion')) {
      return 'critical'
    }
    
    // High indicators
    if (message.includes('failed') || message.includes('unauthorized') || message.includes('suspicious') ||
        message.includes('exploit') || message.includes('attack')) {
      return 'high'
    }
    
    // Medium indicators
    if (message.includes('warning') || message.includes('error') || message.includes('timeout') ||
        message.includes('exceeded') || message.includes('violation')) {
      return 'medium'
    }
    
    return 'low'
  }

  private extractMessage(kafkaData: KafkaLogData): string {
    const data = kafkaData.data
    
    // Try to extract meaningful message from the data
    if (data.message) return data.message
    if (data.description) return data.description
    if (data.event) return data.event
    if (data.action) return data.action
    
    // Fallback: create a message from the log type and data
    return `${kafkaData.log_type} event detected`
  }

  private extractIP(kafkaData: KafkaLogData): string {
    const data = kafkaData.data
    
    // Try to extract IP from various possible fields
    if (data.ip) return data.ip
    if (data.source_ip) return data.source_ip
    if (data.client_ip) return data.client_ip
    if (data.remote_addr) return data.remote_addr
    
    // Fallback IP
    return '192.168.1.100'
  }

  private extractUser(kafkaData: KafkaLogData): string {
    const data = kafkaData.data
    
    // Try to extract user from various possible fields
    if (data.user) return data.user
    if (data.username) return data.username
    if (data.user_id) return data.user_id
    if (data.account) return data.account
    
    // Fallback user
    return 'unknown'
  }

  private detectThreat(log: LogEntry): ThreatAlert | null {
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

  // Public methods
  public onLogMessage(handler: (log: LogEntry) => void) {
    this.messageHandlers.push(handler)
  }

  public onThreatDetected(handler: (threat: ThreatAlert) => void) {
    this.threatHandlers.push(handler)
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  public isConnectedToKafka(): boolean {
    return this.isConnected
  }
}

// Create a singleton instance
const kafkaService = new KafkaService()

export default kafkaService 