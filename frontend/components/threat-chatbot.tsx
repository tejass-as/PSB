"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, Send, User, Sparkles, RotateCcw, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ThreatAlert } from "@/lib/log-simulator"
import geminiService from "@/lib/gemini-service"

interface ChatMessage {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "solution" | "info" | "question" | "warning" | "success"
}

interface ThreatChatbotProps {
  threats: ThreatAlert[]
  onResolveThreat: (threatId: string) => void
  value?: string // <-- add this
}

export function ThreatChatbot({ threats, onResolveThreat, value }: ThreatChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm your AI security assistant powered by Gemini. I can help you understand and resolve security threats. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
      type: "info"
    }
  ])
  const [inputValue, setInputValue] = useState("")

  // Add this effect:
  useEffect(() => {
    if (value) {
      setInputValue(value)
    }
  }, [value])

  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Generate AI response using Gemini
  const generateAIResponse = async (userInput: string): Promise<string> => {
    try {
      // Use Gemini service to generate response
      const response = await geminiService.generateThreatResponse(userInput, threats)
      return response
    } catch (error) {
      console.error('Error generating AI response:', error)
      
      // Fallback responses if Gemini fails
      const input = userInput.toLowerCase()
      
      if (threats.length > 0) {
        const currentThreat = threats[0]
        
        if (input.includes("current") || input.includes("active") || input.includes("threat")) {
          return `I can see you have an active "${currentThreat.type}" threat with ${currentThreat.severity} severity.\n\n**Threat Details:**\n• Type: ${currentThreat.type}\n• Severity: ${currentThreat.severity.toUpperCase()}\n• Source IP: ${currentThreat.ip}\n• Description: ${currentThreat.description}\n\nWould you like me to help you resolve this specific threat or explain what it means?`
        }
        
        if (input.includes("resolve") || input.includes("fix") || input.includes("solve")) {
          return `I can help you resolve the "${currentThreat.type}" threat. Here's my recommended approach:\n\n1. **Quick Resolution:**\n   • Click the resolve button next to the threat\n   • This will mark it as handled\n\n2. **Thorough Investigation:**\n   • Review the threat details\n   • Check related logs\n   • Implement preventive measures\n\n3. **Follow-up:**\n   • Monitor for similar threats\n   • Update security policies if needed\n\nWould you like me to guide you through the resolution process for this specific threat?`
        }
      }
      
      // Default fallback responses
      const defaultResponses = [
        "I understand you're asking about security. Could you provide more specific details about what you'd like to know?",
        "That's an interesting security question. Let me help you understand this better. Could you clarify what specific aspect you're concerned about?",
        "I'm here to help with security matters. To provide the best assistance, could you give me more context about your question?",
        "Security is a complex topic. I'd be happy to help you understand this better. What specific information are you looking for?"
      ]

      return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
    }
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
        type: "info"
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error in handleSendMessage:', error)
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
        content: "Hello! I'm your AI security assistant powered by Gemini. I can help you understand and resolve security threats. What would you like to know?",
        sender: "bot",
        timestamp: new Date(),
        type: "info"
      }
    ])
  }

  const getMessageStyle = (message: ChatMessage) => {
    // Remove green color - always use the default slate styling
    return "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600"
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm h-[70vh] flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-600 dark:to-slate-500 rounded-xl shadow-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                AI Security Assistant
                <Badge className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white text-xs border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Gemini AI
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Powered by Gemini AI - Get instant help with security threats and solutions
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all duration-200 flex-shrink-0 group"
            title="Clear chat"
          >
            <RotateCcw className="h-4 w-4 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
          </motion.button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Chat Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4" ref={chatContainerRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0 shadow-sm border-2 border-white dark:border-slate-700">
                      <AvatarImage src={message.sender === "bot" ? "/bot-avatar.png" : undefined} />
                      <AvatarFallback className={message.sender === "bot" ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white" : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"}>
                        {message.sender === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.sender === "user" 
                        ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white" 
                        : getMessageStyle(message)
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                        {message.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-2 text-xs ${
                        message.sender === "user" 
                          ? "text-blue-100" 
                          : "text-slate-500 dark:text-slate-400"
                      }`}>
                        <Clock className="h-3 w-3" />
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
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0 shadow-sm border-2 border-white dark:border-slate-700">
                    <AvatarFallback className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-600">
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-slate-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-slate-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-slate-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/50">
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about security threats, solutions, or best practices..."
                className="pr-12 h-12 rounded-xl border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                disabled={isTyping}
              />
              {isTyping && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full"
                  />
                </div>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="h-12 px-6 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl shadow-sm border-0 font-medium"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}