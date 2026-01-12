import cors from "cors"
import express from "express"
import cartsRouter from "./routes/carts"
import productsRouter from "./routes/products"
import webhookRouter from "./routes/webhook"

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/products", productsRouter)
app.use("/carts", cartsRouter)
app.use("/webhook", webhookRouter)

// Health check
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Laburen WhatsApp AI Agent API",
    version: "1.0.0",
    runtime: "Bun + TypeScript",
    endpoints: {
      products: "/products",
      carts: "/carts",
      webhook: "/webhook",
    },
  })
})

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err)
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    })
  }
)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/webhook`)
  console.log("⚡ Powered by Node.js + TypeScript")
})
