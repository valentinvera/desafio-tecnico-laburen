import {
  type Content,
  type FunctionDeclaration,
  GoogleGenerativeAI,
} from "@google/generative-ai"
import { getSystemPrompt } from "./prompts"
import { executeFunction, getTools } from "./tools"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Store conversation history per session
interface SessionData {
  messages: Content[]
  lastActivity: number
}

const conversationHistory = new Map<string, SessionData>()

// Get or create session history
function getSessionHistory(sessionId: string): SessionData {
  const existing = conversationHistory.get(sessionId)
  if (existing) {
    return existing
  }
  const newSession: SessionData = {
    messages: [],
    lastActivity: Date.now(),
  }
  conversationHistory.set(sessionId, newSession)
  return newSession
}

// Clean old sessions (older than 24 hours)
function cleanOldSessions(): void {
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  const now = Date.now()

  for (const [sessionId, data] of conversationHistory.entries()) {
    if (data.lastActivity && now - data.lastActivity > maxAge) {
      conversationHistory.delete(sessionId)
    }
  }
}

// Run cleanup every hour
setInterval(cleanOldSessions, 60 * 60 * 1000)

/**
 * Process an incoming message from WhatsApp
 */
export async function processMessage(
  from: string,
  message: string
): Promise<string> {
  try {
    // Get or create conversation history for this session
    const history = getSessionHistory(from)

    // Initialize the model with function calling
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: getSystemPrompt(from),
      tools: [{ functionDeclarations: getTools() as FunctionDeclaration[] }],
    })

    // Start or continue chat
    const chat = model.startChat({
      history: history.messages,
    })

    // Send user message
    let result = await chat.sendMessage(message)
    let response = result.response

    // Handle function calls
    const maxIterations = 10
    let iteration = 0

    while (
      response.functionCalls() &&
      (response.functionCalls()?.length ?? 0) > 0 &&
      iteration < maxIterations
    ) {
      iteration++
      const functionCalls = response.functionCalls()
      if (!functionCalls) {
        break
      }

      console.log(`🔧 Executing ${functionCalls.length} function(s)...`)

      // Execute all function calls
      const functionResponses: Array<{
        functionResponse: {
          name: string
          response: { result: Record<string, unknown> }
        }
      }> = []

      for (const call of functionCalls) {
        console.log(`   - ${call.name}(${JSON.stringify(call.args)})`)
        const functionResult = await executeFunction(
          call.name,
          call.args as Record<string, unknown>,
          from
        )
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: functionResult },
          },
        })
      }

      // Send function results back to the model
      result = await chat.sendMessage(functionResponses)
      response = result.response
    }

    // Get final text response
    const textResponse = response.text()

    // Update conversation history
    history.messages = await chat.getHistory()
    history.lastActivity = Date.now()

    console.log(`🤖 AI Response: ${textResponse.substring(0, 100)}...`)

    return textResponse
  } catch (error) {
    console.error("Error processing message:", error)

    // Return friendly error message
    if (error instanceof Error && error.message?.includes("API_KEY")) {
      return "Hay un problema con la configuración del servicio. Por favor, contacta al administrador."
    }

    return "Lo siento, hubo un error procesando tu mensaje. Por favor, intenta de nuevo."
  }
}
