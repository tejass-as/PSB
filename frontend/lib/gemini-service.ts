interface GeminiRequest {
  prompt: string
  context?: string
  threats?: any[]
}

interface GeminiResponse {
  response?: string
  error?: string
}

export class GeminiService {
  private apiUrl = '/api/gemini'

  async generateResponse(prompt: string, context?: string): Promise<string> {
    try {
      const requestBody: GeminiRequest = {
        prompt,
        context
      }

      console.log('Making request to:', this.apiUrl, requestBody)

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data: GeminiResponse = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.response) {
        throw new Error('No response generated from Gemini')
      }

      return data.response
    } catch (error) {
      console.error('Gemini API error:', error)
      throw error
    }
  }

  async generateThreatResponse(userInput: string, threats: any[]): Promise<string> {
    const requestBody: GeminiRequest = {
      prompt: userInput,
      threats
    }

    try {
      console.log('Making threat request to:', this.apiUrl, { prompt: userInput, threatsCount: threats.length })

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Threat response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data: GeminiResponse = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.response) {
        throw new Error('No response generated from Gemini')
      }

      return data.response
    } catch (error) {
      console.error('Gemini API error:', error)
      throw error
    }
  }
}

// Create a singleton instance
const geminiService = new GeminiService()

export default geminiService 