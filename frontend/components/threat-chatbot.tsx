"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, Send, User, Sparkles, Shield, AlertTriangle, MessageCircle, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ThreatAlert } from "@/lib/log-simulator"

interface ChatMessage {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "solution" | "info" | "question"
}

interface ThreatChatbotProps {
  threats: ThreatAlert[]
  onResolveThreat: (threatId: string) => void
}

export function ThreatChatbot({ threats, onResolveThreat }: ThreatChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm your AI security assistant. I can help you understand and resolve security threats. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
      type: "info"
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [lastThreatCount, setLastThreatCount] = useState(threats.length)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Auto-suggest help when new threats are detected
  useEffect(() => {
    if (threats.length > lastThreatCount && threats.length > 0) {
      const newThreat = threats[0]
      const suggestionMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `🚨 New threat detected: "${newThreat.type}" with ${newThreat.severity} severity.\n\nI can help you:\n• Understand this threat\n• Provide resolution steps\n• Suggest preventive measures\n\nWhat would you like to know about this threat?`,
        sender: "bot",
        timestamp: new Date(),
        type: "solution"
      }
      setMessages(prev => [...prev, suggestionMessage])
    }
    setLastThreatCount(threats.length)
  }, [threats.length, lastThreatCount, threats])

  // Generate AI response based on user input and current threats
  const generateAIResponse = async (userInput: string): Promise<string> => {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const input = userInput.toLowerCase()
    
    // Check for current threats and provide contextual responses
    if (threats.length > 0) {
      const currentThreat = threats[0]
      
      if (input.includes("current") || input.includes("active") || input.includes("threat")) {
        return `I can see you have an active "${currentThreat.type}" threat with ${currentThreat.severity} severity.\n\n**Threat Details:**\n• Type: ${currentThreat.type}\n• Severity: ${currentThreat.severity.toUpperCase()}\n• Source IP: ${currentThreat.ip}\n• Description: ${currentThreat.description}\n\nWould you like me to help you resolve this specific threat or explain what it means?`
      }
      
      if (input.includes("resolve") || input.includes("fix") || input.includes("solve")) {
        return `I can help you resolve the "${currentThreat.type}" threat. Here's my recommended approach:\n\n1. **Quick Resolution:**\n   • Click the resolve button next to the threat\n   • This will mark it as handled\n\n2. **Thorough Investigation:**\n   • Review the threat details\n   • Check related logs\n   • Implement preventive measures\n\n3. **Follow-up:**\n   • Monitor for similar threats\n   • Update security policies if needed\n\nWould you like me to guide you through the resolution process for this specific threat?`
      }
    }
    
    // Threat-specific responses
    if (input.includes("brute force") || input.includes("failed login")) {
      return "For brute force attacks, I recommend:\n\n1. **Immediate Actions:**\n   • Block the suspicious IP address\n   • Enable account lockout policies\n   • Review failed login patterns\n\n2. **Prevention:**\n   • Implement rate limiting\n   • Use CAPTCHA for login attempts\n   • Enable multi-factor authentication\n\n3. **Monitoring:**\n   • Set up alerts for multiple failed attempts\n   • Monitor login patterns from unusual locations\n\nWould you like me to help you implement any of these solutions?"
    }

    if (input.includes("malware") || input.includes("virus")) {
      return "For malware detection, here's what you should do:\n\n1. **Immediate Response:**\n   • Isolate the affected system\n   • Run full system scan with updated antivirus\n   • Check for unauthorized network connections\n\n2. **Investigation:**\n   • Analyze the malware signature\n   • Check system logs for entry point\n   • Review recent file downloads/executions\n\n3. **Recovery:**\n   • Remove infected files\n   • Update security patches\n   • Restore from clean backup if needed\n\nShould I help you with the isolation process?"
    }

    if (input.includes("intrusion") || input.includes("unauthorized")) {
      return "For intrusion attempts, follow these steps:\n\n1. **Containment:**\n   • Block the source IP immediately\n   • Disconnect affected systems if necessary\n   • Preserve evidence for analysis\n\n2. **Assessment:**\n   • Determine the scope of the intrusion\n   • Check for data exfiltration\n   • Review system integrity\n\n3. **Response:**\n   • Patch any exploited vulnerabilities\n   • Strengthen access controls\n   • Update incident response procedures\n\nDo you need help with the containment process?"
    }

    if (input.includes("data breach") || input.includes("breach")) {
      return "For data breach incidents, follow this critical response plan:\n\n1. **Immediate Response (First 24 hours):**\n   • Isolate affected systems\n   • Preserve all evidence\n   • Notify key stakeholders\n   • Document everything\n\n2. **Investigation:**\n   • Determine scope and impact\n   • Identify compromised data\n   • Trace the attack vector\n   • Assess regulatory requirements\n\n3. **Notification & Compliance:**\n   • Notify affected parties\n   • Report to authorities if required\n   • Engage legal counsel\n   • Prepare public statements\n\n4. **Recovery:**\n   • Patch vulnerabilities\n   • Implement additional security\n   • Restore from clean backups\n   • Monitor for further activity\n\nThis is a serious incident. Do you need help with the immediate response steps?"
    }

    if (input.includes("ransomware")) {
      return "For ransomware attacks, time is critical. Here's what to do:\n\n1. **Immediate Actions:**\n   • Disconnect infected systems from network\n   • Do NOT pay the ransom\n   • Document the ransom note and demands\n   • Contact law enforcement\n\n2. **Containment:**\n   • Isolate all affected systems\n   • Disable network shares\n   • Change all passwords\n   • Check for lateral movement\n\n3. **Recovery:**\n   • Restore from clean backups\n   • Rebuild compromised systems\n   • Update all security patches\n   • Implement additional monitoring\n\n4. **Prevention:**\n   • Regular backups (offline)\n   • Employee training\n   • Email filtering\n   • Network segmentation\n\nThis is an emergency situation. Do you need immediate assistance?"
    }

    if (input.includes("best practices") || input.includes("prevention")) {
      return "Here are essential security best practices:\n\n🔒 **Access Control:**\n   • Multi-factor authentication (MFA)\n   • Principle of least privilege\n   • Regular access reviews\n   • Strong password policies\n\n🛡️ **Network Security:**\n   • Firewall configuration\n   • Network segmentation\n   • VPN for remote access\n   • Regular security updates\n\n📊 **Monitoring & Detection:**\n   • SIEM implementation\n   • Log monitoring\n   • Intrusion detection systems\n   • Regular security assessments\n\n📚 **Training & Awareness:**\n   • Security awareness training\n   • Phishing simulations\n   • Incident response drills\n   • Regular policy updates\n\nWould you like me to elaborate on any of these areas?"
    }

    if (input.includes("help") || input.includes("what can you do")) {
      return "I'm your AI security assistant! Here's what I can help you with:\n\n🔍 **Threat Analysis:**\n   • Explain different types of threats\n   • Assess threat severity and impact\n   • Provide context about security events\n\n🛠️ **Resolution Guidance:**\n   • Step-by-step solutions for threats\n   • Best practices for security response\n   • Preventive measures and recommendations\n\n📊 **Security Insights:**\n   • Explain security concepts\n   • Help understand log entries\n   • Provide security recommendations\n\n💬 **General Support:**\n   • Answer security questions\n   • Explain technical terms\n   • Provide guidance on security policies\n\nWhat would you like to know about?"
    }

    if (input.includes("hello") || input.includes("hi")) {
      return "Hello! 👋 I'm here to help you with any security concerns. I can see you have a threat detection system running. How can I assist you today?"
    }

    if (input.includes("severity") || input.includes("critical") || input.includes("high") || input.includes("medium") || input.includes("low")) {
      return "Security threat severity levels help prioritize responses:\n\n🔴 **Critical:**\n   • Immediate response required\n   • System compromise likely\n   • Data breach in progress\n   • 24/7 incident response\n\n🟠 **High:**\n   • Response within hours\n   • Potential system impact\n   • Requires investigation\n   • May need containment\n\n🟡 **Medium:**\n   • Response within 24 hours\n   • Limited system impact\n   • Monitor for escalation\n   • Standard procedures\n\n🟢 **Low:**\n   • Response within days\n   • Minimal system impact\n   • Routine handling\n   • Documentation required\n\nHow can I help you assess the severity of your current threats?"
    }

    // Default responses
    const defaultResponses = [
      "I understand you're asking about security. Could you provide more specific details about what you'd like to know?",
      "That's an interesting security question. Let me help you understand this better. Could you clarify what specific aspect you're concerned about?",
      "I'm here to help with security matters. To provide the best assistance, could you give me more context about your question?",
      "Security is a complex topic. I'd be happy to help you understand this better. What specific information are you looking for?"
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const aiResponse = await generateAIResponse(inputValue)
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "bot",
        timestamp: new Date(),
        type: aiResponse.includes("recommend") || aiResponse.includes("step") ? "solution" : "info"
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
        type: "info"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        content: "Hello! I'm your AI security assistant. I can help you understand and resolve security threats. What would you like to know?",
        sender: "bot",
        timestamp: new Date(),
        type: "info"
      }
    ])
  }

  const getQuickActions = () => {
    if (threats.length === 0) {
      return [
        { label: "What can you help me with?", action: "help" },
        { label: "Explain security concepts", action: "explain security" },
        { label: "Best practices", action: "best practices" },
        { label: "Threat severity levels", action: "explain severity levels" }
      ]
    }

    const currentThreat = threats[0]
    const threatType = currentThreat.type.toLowerCase()
    
    return [
      { label: `Current threat: ${currentThreat.type}`, action: "tell me about the current threat" },
      { label: `Help with ${currentThreat.type}`, action: `help with ${threatType}` },
      { label: "How to resolve", action: "how to resolve this threat" },
      { label: "Security best practices", action: "best practices" }
    ]
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm h-[70vh] flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-slate-800 dark:bg-slate-700 rounded-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold flex items-center">
              AI Security Assistant
              <Badge className="ml-2 bg-slate-700 hover:bg-slate-800 text-white text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              Get instant help with security threats and solutions
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            title="Clear chat"
          >
            <RotateCcw className="h-3 w-3 text-slate-500" />
          </motion.button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Quick Actions */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {getQuickActions().map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInputValue(action.action)}
                className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3" ref={chatContainerRef}>
          <div className="space-y-3">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={message.sender === "bot" ? "/bot-avatar.png" : undefined} />
                        <AvatarFallback className={message.sender === "bot" ? "bg-slate-700 dark:bg-slate-600 text-white" : "bg-slate-200 dark:bg-slate-700"}>
                          {message.sender === "bot" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        </AvatarFallback>
                      </Avatar>
                      
                                          <div className={`rounded-xl px-3 py-2 ${
                      message.sender === "user" 
                        ? "bg-slate-700 dark:bg-slate-600 text-white" 
                        : message.type === "solution"
                          ? "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600"
                          : "bg-slate-100 dark:bg-slate-700"
                    }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1.5 ${
                          message.sender === "user" 
                            ? "text-blue-100" 
                            : "text-slate-500 dark:text-slate-400"
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="bg-slate-700 dark:bg-slate-600 text-white">
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2">
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
                         </div>
           </div>

        {/* Input Area */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about security threats, solutions, or best practices..."
              className="flex-1"
              disabled={isTyping}
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-slate-700 hover:bg-slate-800 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 