import type { Prisma } from "@prisma/client"
import { type Request, type Response, Router } from "express"
import prisma from "../lib/prisma"

const router = Router()

interface ProductQuery {
  q?: string
  category?: string
  size?: string
  color?: string
  available?: string
}

// GET /products - List products with optional search filter
router.get(
  "/",
  async (
    req: Request<Record<string, never>, unknown, unknown, ProductQuery>,
    res: Response
  ) => {
    try {
      const { q, category, size, color, available } = req.query

      const where: Prisma.ProductWhereInput = {}

      // Text search filter (name or description)
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { color: { contains: q, mode: "insensitive" } },
        ]
      }

      // Additional filters
      if (category) {
        where.category = { equals: category, mode: "insensitive" }
      }
      if (size) {
        where.size = { equals: size, mode: "insensitive" }
      }
      if (color) {
        where.color = { equals: color, mode: "insensitive" }
      }
      if (available !== undefined) {
        where.available = available === "true"
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: { id: "asc" },
      })

      res.json({
        count: products.length,
        products: products.map((p) => ({
          id: p.id,
          externalId: p.externalId,
          name: p.name,
          size: p.size,
          color: p.color,
          stock: p.stock,
          price: p.price,
          available: p.available,
          category: p.category,
          description: p.description,
        })),
      })
    } catch (error) {
      console.error("Error fetching products:", error)
      res.status(500).json({ error: "Error al obtener productos" })
    }
  }
)

// GET /products/:id - Get product details
router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    // Try to find by internal ID first, then by external ID
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: Number.parseInt(id, 10) || 0 }, { externalId: id }],
      },
    })

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    res.json({
      id: product.id,
      externalId: product.externalId,
      name: product.name,
      size: product.size,
      color: product.color,
      stock: product.stock,
      price: product.price,
      price100: product.price100,
      price200: product.price200,
      available: product.available,
      category: product.category,
      description: product.description,
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ error: "Error al obtener producto" })
  }
})

export default router
