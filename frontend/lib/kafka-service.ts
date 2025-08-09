interface KafkaLogData {
    kafka_metadata: {
      topic: string
      partition: number
      offset: number
      timestamp: number
      received_at: string
    }
    data: {
      id: number
      time: string
      topic: string
      anomaly_score: number
      is_anomaly: boolean
      processing_timestamp: string
      data: {
        UserName: string
        EventID: string
        LogHost: string
        LogonID: string
        DomainName: string
        ParentProcessName: string
        ParentProcessID: string
        ProcessName: string
        Time: string
        ProcessID: string
        LogonTypeDescription: string
        Source: string
        AuthenticationPackage: string
        LogonType: string
        Destination: string
        SubjectUserName: string
        SubjectLogonID: string
        SubjectDomainName: string
        Status: string
        ServiceName: string
        FailureReason: string
        // add other possible fields if needed
      }
    }
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
  
            const logEntry = this.convertKafkaDataToLogEntry(kafkaData)
  
            this.messageHandlers.forEach(handler => handler(logEntry))
  
            const threat = this.detectThreat(logEntry)
            if (threat) {
              this.threatHandlers.forEach(handler => handler(threat))
            }
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
      const eventData = kafkaData.data?.data || {}
  
      const severity = this.determineSeverity(kafkaData)
      const source = eventData?.Source || kafkaData.data?.topic || 'unknown'
      const ip = eventData?.Destination || eventData?.Source || kafkaData.data?.time || '0.0.0.0'   
      const user = eventData?.SubjectUserName || eventData?.UserName || 'unknown'
  
      let message = '';
      if (kafkaData.data?.topic?.toLowerCase() === 'hostevent') {
        message = `Host Event from ${eventData?.DomainName}, Event ID: ${eventData?.EventID}`;
      } 
      else if (kafkaData.data?.topic?.toLowerCase() === 'netflow') {
        message = `Netflow detected from ${eventData?.SrcDevice} to ${eventData?.DstDevice}`;
      } 
      else {
        message = `${kafkaData.data.topic} event + ${eventData?.path}`;
      }

      return {
        id: kafkaData.data?.id.toString(),
        timestamp: new Date(kafkaData.data?.processing_timestamp),
        source,
        severity,
        message,
        ip,
        user,
      }
    }
  
    private determineSeverity(kafkaData: KafkaLogData): "low" | "medium" | "high" | "critical" {
        const score = kafkaData.data?.anomaly_score ?? 0;
      
        if (score >= 1.3) {
          return "critical";
        }
        if (score >= 0.75) {
          return "high";
        }
        if (score >= 0.6) {
          return "medium";
        }
        return "low";
      }
      
  
    private detectThreat(log: LogEntry): ThreatAlert | null {
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
      const containsThreatKeyword = threatKeywords.some(keyword => log.message.toLowerCase().includes(keyword))
  
      if (isHighSeverity) {
        const threatTypes: Record<string, string> = {
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
        const detectedKeyword = threatKeywords.find(keyword => log.message.toLowerCase().includes(keyword)) || "failed"
  
        return {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          type: threatTypes[detectedKeyword],
          severity: log.severity,
          description: `Detected ${threatTypes[detectedKeyword].toLowerCase()} from ${log.source} system targeting ${log.user}`,
          ip: log.ip,
        }
      }
  
      return null
    }
  
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
  
  const kafkaService = new KafkaService()
  
  export default kafkaService
  