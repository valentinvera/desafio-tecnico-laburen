import type { Request, Response } from "express"
import { Router } from "express"
import twilio from "twilio"
import { processMessage } from "../agent"

const router = Router()

// Twilio client for sending messages
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// GET /webhook - Health check endpoint
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "WhatsApp webhook is running (Twilio)",
  })
})

// POST /webhook - Receive messages from Twilio WhatsApp Sandbox
router.post("/", async (req: Request, res: Response) => {
  try {
    const { Body, From } = req.body

    // Extract phone number (remove "whatsapp:" prefix)
    const fromNumber = From?.replace("whatsapp:", "") || ""
    const messageText = Body || ""

    if (!(fromNumber && messageText)) {
      console.log("📭 Empty message received, ignoring")
      return res.status(200).send()
    }

    console.log(`📨 Message from ${fromNumber}: ${messageText}`)

    // Process message with AI agent
    const response = await processMessage(fromNumber, messageText)

    // Send response back via Twilio
    await sendWhatsAppMessage(From, response)

    console.log(`📤 Response sent to ${fromNumber}`)

    // Respond to Twilio with empty TwiML (we send via API instead)
    res.set("Content-Type", "text/xml")
    res.status(200).send("<Response></Response>")
  } catch (error) {
    console.error("Error processing webhook:", error)
    res.status(500).send("<Response></Response>")
  }
})

// Send message via Twilio WhatsApp API
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

  if (!twilioWhatsAppNumber) {
    throw new Error("TWILIO_WHATSAPP_NUMBER not configured")
  }

  try {
    const message = await twilioClient.messages.create({
      from: twilioWhatsAppNumber,
      to,
      body: text,
    })

    console.log(`✅ Message sent with SID: ${message.sid}`)
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    throw error
  }
}

export default router
