import { type Request, type Response, Router } from "express"
import { processMessage } from "../agent"

const router = Router()

interface WebhookQuery {
  "hub.mode"?: string
  "hub.verify_token"?: string
  "hub.challenge"?: string
}

interface WhatsAppMessage {
  from: string
  id: string
  text?: {
    body: string
  }
}

interface WhatsAppStatus {
  id: string
  status: string
}

interface WhatsAppWebhookBody {
  object: string
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: WhatsAppMessage[]
        statuses?: WhatsAppStatus[]
      }
    }>
  }>
}

interface WhatsAppApiResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

// GET /webhook - Verification endpoint for WhatsApp
router.get(
  "/",
  (
    req: Request<Record<string, never>, unknown, unknown, WebhookQuery>,
    res: Response
  ) => {
    const mode = req.query["hub.mode"]
    const token = req.query["hub.verify_token"]
    const challenge = req.query["hub.challenge"]

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

    if (mode && token) {
      if (mode === "subscribe" && token === verifyToken) {
        console.log("✅ Webhook verified successfully")
        res.status(200).send(challenge)
      } else {
        console.log("❌ Webhook verification failed")
        res.sendStatus(403)
      }
    } else {
      res.sendStatus(400)
    }
  }
)

// POST /webhook - Receive messages from WhatsApp
router.post(
  "/",
  async (
    req: Request<Record<string, never>, unknown, WhatsAppWebhookBody>,
    res: Response
  ) => {
    try {
      const body = req.body

      // Check if this is a WhatsApp status update
      if (body.object === "whatsapp_business_account") {
        const entry = body.entry?.[0]
        const changes = entry?.changes?.[0]
        const value = changes?.value

        // Check for incoming messages
        if (value?.messages) {
          const message = value.messages[0]
          const from = message.from
          const messageText = message.text?.body || ""

          console.log(`📨 Message from ${from}: ${messageText}`)

          // Process message with AI agent
          const response = await processMessage(from, messageText)

          // Send response back to WhatsApp
          await sendWhatsAppMessage(from, response)

          console.log(`📤 Response sent to ${from}`)
        }

        // Check for message status updates
        if (value?.statuses) {
          const status = value.statuses[0]
          console.log(`📊 Message ${status.id} status: ${status.status}`)
        }

        res.sendStatus(200)
      } else {
        res.sendStatus(404)
      }
    } catch (error) {
      console.error("Error processing webhook:", error)
      res.sendStatus(500)
    }
  }
)

// Send message via WhatsApp Cloud API
async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<WhatsAppApiResponse> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_TOKEN

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: text,
        preview_url: false,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("WhatsApp API error:", errorData)
    throw new Error("Failed to send WhatsApp message")
  }

  return (await response.json()) as WhatsAppApiResponse
}

export default router
