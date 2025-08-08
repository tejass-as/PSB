"use client"

import { useEffect, useRef } from "react"
import type { ThreatAlert } from "@/lib/log-simulator"

interface VoiceNotificationProps {
  threats: ThreatAlert[]
  settings: {
    voiceAlerts: boolean
    voiceVolume: number
    alertThreshold: string
  }
}

export function VoiceNotification({ threats, settings }: VoiceNotificationProps) {
  const lastThreatCount = useRef(0)

  useEffect(() => {
    if (settings.voiceAlerts && threats.length > lastThreatCount.current && threats.length > 0) {
      const latestThreat = threats[0]

      // Check if threat meets threshold
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
      const thresholdLevels = { low: 1, medium: 2, high: 3, critical: 4 }

      if (
        severityLevels[latestThreat.severity as keyof typeof severityLevels] >=
        thresholdLevels[settings.alertThreshold as keyof typeof thresholdLevels]
      ) {
        speakAlert(latestThreat)
      }
    }
    lastThreatCount.current = threats.length
  }, [threats, settings])

  const speakAlert = (threat: ThreatAlert) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const message = `Security Alert: ${threat.type} detected from IP ${threat.ip}. Severity level: ${threat.severity}. ${threat.description}`

      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = "en-US";
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = settings.voiceVolume / 100

      // Try to use a more robotic/computer voice if available
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.toLowerCase().includes("microsoft") ||
          voice.name.toLowerCase().includes("google") ||
          voice.name.toLowerCase().includes("alex"),
      )

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  return null
}
