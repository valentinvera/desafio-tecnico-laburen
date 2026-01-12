import { type Request, type Response, Router } from "express"
import prisma from "../lib/prisma"

const router = Router()

interface CartItem {
  product_id: number
  qty: number
}

interface CreateCartBody {
  items: CartItem[]
  sessionId?: string
}

interface UpdateCartBody {
  items: CartItem[]
}

// POST /carts - Create a new cart with items
router.post(
  "/",
  async (
    req: Request<Record<string, never>, unknown, CreateCartBody>,
    res: Response
  ) => {
    try {
      const { items, sessionId } = req.body

      if (!(items && Array.isArray(items)) || items.length === 0) {
        return res.status(400).json({ error: "Se requiere un array de items" })
      }

      // Validate all products exist
      const productIds = items.map((item) => item.product_id)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      })

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id)
        const notFound = productIds.filter((id) => !foundIds.includes(id))
        return res.status(404).json({
          error: "Algunos productos no existen",
          notFoundIds: notFound,
        })
      }

      // Check stock availability
      for (const item of items) {
        const product = products.find((p) => p.id === item.product_id)
        if (product && product.stock < item.qty) {
          return res.status(400).json({
            error: `Stock insuficiente para ${product.name}`,
            product_id: product.id,
            available_stock: product.stock,
            requested: item.qty,
          })
        }
      }

      // Generate session ID if not provided
      const cartSessionId =
        sessionId ||
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Check if cart already exists for this session
      let cart = await prisma.cart.findUnique({
        where: { sessionId: cartSessionId },
        include: { items: { include: { product: true } } },
      })

      if (cart) {
        // Update existing cart
        for (const item of items) {
          const existingItem = cart.items.find(
            (ci) => ci.productId === item.product_id
          )
          if (existingItem) {
            await prisma.cartItem.update({
              where: { id: existingItem.id },
              data: { qty: existingItem.qty + item.qty },
            })
          } else {
            await prisma.cartItem.create({
              data: {
                cartId: cart.id,
                productId: item.product_id,
                qty: item.qty,
              },
            })
          }
        }
      } else {
        // Create new cart
        cart = await prisma.cart.create({
          data: {
            sessionId: cartSessionId,
            items: {
              create: items.map((item) => ({
                productId: item.product_id,
                qty: item.qty,
              })),
            },
          },
          include: { items: { include: { product: true } } },
        })
      }

      // Fetch updated cart with items
      const updatedCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: { product: true },
          },
        },
      })

      if (!updatedCart) {
        return res.status(500).json({ error: "Error al crear carrito" })
      }

      // Calculate total
      const total = updatedCart.items.reduce((sum, item) => {
        return sum + item.product.price * item.qty
      }, 0)

      res.status(201).json({
        id: updatedCart.id,
        sessionId: updatedCart.sessionId,
        createdAt: updatedCart.createdAt,
        updatedAt: updatedCart.updatedAt,
        items: updatedCart.items.map((item) => ({
          id: item.id,
          product_id: item.productId,
          product_name: item.product.name,
          size: item.product.size,
          color: item.product.color,
          qty: item.qty,
          unit_price: item.product.price,
          subtotal: item.product.price * item.qty,
        })),
        total,
      })
    } catch (error) {
      console.error("Error creating cart:", error)
      res.status(500).json({ error: "Error al crear carrito" })
    }
  }
)

// GET /carts/:id - Get cart by ID or session ID
router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    const cart = await prisma.cart.findFirst({
      where: {
        OR: [{ id: Number.parseInt(id, 10) || 0 }, { sessionId: id }],
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    const total = cart.items.reduce((sum, item) => {
      return sum + item.product.price * item.qty
    }, 0)

    res.json({
      id: cart.id,
      sessionId: cart.sessionId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.items.map((item) => ({
        id: item.id,
        product_id: item.productId,
        product_name: item.product.name,
        size: item.product.size,
        color: item.product.color,
        qty: item.qty,
        unit_price: item.product.price,
        subtotal: item.product.price * item.qty,
      })),
      total,
    })
  } catch (error) {
    console.error("Error fetching cart:", error)
    res.status(500).json({ error: "Error al obtener carrito" })
  }
})

// PATCH /carts/:id - Update cart items
router.patch(
  "/:id",
  async (
    req: Request<{ id: string }, unknown, UpdateCartBody>,
    res: Response
  ) => {
    try {
      const { id } = req.params
      const { items } = req.body

      if (!(items && Array.isArray(items))) {
        return res.status(400).json({ error: "Se requiere un array de items" })
      }

      // Find cart
      const cart = await prisma.cart.findFirst({
        where: {
          OR: [{ id: Number.parseInt(id, 10) || 0 }, { sessionId: id }],
        },
        include: { items: true },
      })

      if (!cart) {
        return res.status(404).json({ error: "Carrito no encontrado" })
      }

      // Process each item update
      for (const item of items) {
        const existingItem = cart.items.find(
          (ci) => ci.productId === item.product_id
        )

        if (item.qty === 0) {
          // Remove item if qty is 0
          if (existingItem) {
            await prisma.cartItem.delete({
              where: { id: existingItem.id },
            })
          }
        } else if (existingItem) {
          // Update existing item
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { qty: item.qty },
          })
        } else {
          // Add new item
          const product = await prisma.product.findUnique({
            where: { id: item.product_id },
          })

          if (!product) {
            return res.status(404).json({
              error: `Producto ${item.product_id} no encontrado`,
            })
          }

          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.product_id,
              qty: item.qty,
            },
          })
        }
      }

      // Update cart timestamp
      await prisma.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() },
      })

      // Fetch updated cart
      const updatedCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: { product: true },
          },
        },
      })

      if (!updatedCart) {
        return res.status(500).json({ error: "Error al actualizar carrito" })
      }

      const total = updatedCart.items.reduce((sum, item) => {
        return sum + item.product.price * item.qty
      }, 0)

      res.json({
        id: updatedCart.id,
        sessionId: updatedCart.sessionId,
        createdAt: updatedCart.createdAt,
        updatedAt: updatedCart.updatedAt,
        items: updatedCart.items.map((item) => ({
          id: item.id,
          product_id: item.productId,
          product_name: item.product.name,
          size: item.product.size,
          color: item.product.color,
          qty: item.qty,
          unit_price: item.product.price,
          subtotal: item.product.price * item.qty,
        })),
        total,
      })
    } catch (error) {
      console.error("Error updating cart:", error)
      res.status(500).json({ error: "Error al actualizar carrito" })
    }
  }
)

// DELETE /carts/:id - Delete a cart
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    const cart = await prisma.cart.findFirst({
      where: {
        OR: [{ id: Number.parseInt(id, 10) || 0 }, { sessionId: id }],
      },
    })

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    await prisma.cart.delete({
      where: { id: cart.id },
    })

    res.json({ message: "Carrito eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting cart:", error)
    res.status(500).json({ error: "Error al eliminar carrito" })
  }
})

export default router
