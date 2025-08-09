import { NextRequest, NextResponse } from 'next/server'

interface GeminiRequest {
  contents: {
    role: string,
    parts: {
      text: string
    }[]
  }[]
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
    }
  }[]
}

interface GeminiError {
  error: {
    code: number
    message: string
    status: string
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Gemini API is working' })
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { prompt, context, threats } = body
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }
    
    const apiKey = 'AIzaSyBcasGTdwItLP05HDjET8tK5lRLZHTBaFE'
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    
    // Build the full prompt
    const threatContext = threats && threats.length > 0 
      ? `Active threats detected: ${threats.map((t: any) => `${t.type} (${t.severity} severity)`).join(', ')}`
      : 'No active threats detected'

    const fullContext = `Security System Context:
- System Type: Threat Detection and Response
- Current Threats: ${threatContext}
- User Role: Security Administrator
- Focus: Threat resolution, security best practices, and incident response

${context || ''}`

    const systemPrompt = `You are an AI security assistant for a threat detection system. You help users understand and resolve security threats.

Your role is to:
1. Provide clear, actionable security advice
2. Explain security concepts in simple terms
3. Offer step-by-step solutions for security issues
4. Help users understand threat severity and impact
5. Suggest preventive measures and best practices

Current context: ${fullContext}

User input: ${prompt}

Please provide a helpful, professional response that:
- Is clear and easy to understand
- Includes actionable steps when relevant
- Uses markdown formatting for better readability
- Focuses on security best practices
- Is concise but comprehensive

Response:`

    const requestBody: GeminiRequest = {
      contents: [
        {
          "role": "user",
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      ]
    }

    console.log('Making request to Gemini API:', { baseUrl, prompt: prompt.substring(0, 100) + '...' })

    const response = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData: GeminiError = await response.json()
      console.error('Gemini API error2:', errorData)
      return NextResponse.json(
        { error: `Gemini API error: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      )
    }

    const data: GeminiResponse = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json(
        { error: 'No response generated from Gemini' },
        { status: 500 }
      )
    }

    const responseText = data.candidates[0].content.parts[0].text

    return NextResponse.json({
      response: responseText
    })

  } catch (error) {
    console.error('Error in Gemini API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 