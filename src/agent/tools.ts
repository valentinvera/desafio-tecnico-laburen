const API_BASE = process.env.API_BASE_URL || "http://localhost:3000"

interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, ToolParameter>
    required?: string[]
  }
}

interface ToolParameter {
  type: string
  description?: string
  items?: ToolParameter
  properties?: Record<string, ToolParameter>
  required?: string[]
}

interface SearchProductsArgs {
  query?: string
  category?: string
  size?: string
  color?: string
}

interface CartItemArgs {
  product_id: number
  qty: number
}

interface CartArgs {
  items: CartItemArgs[]
}

interface ProductApiResponse {
  id: number
  externalId: string
  name: string
  size: string
  color: string
  stock: number
  price: number
  price100?: number
  price200?: number
  available: boolean
  category: string
  description: string
}

interface ProductsListResponse {
  count: number
  products: ProductApiResponse[]
}

interface CartItemResponse {
  id: number
  product_id: number
  product_name: string
  size: string
  color: string
  qty: number
  unit_price: number
  subtotal: number
}

interface CartApiResponse {
  id: number
  sessionId: string
  items: CartItemResponse[]
  total: number
  error?: string
}

interface FunctionResult {
  [key: string]: unknown
}

/**
 * Tool definitions for Gemini function calling
 */
export function getTools(): ToolDefinition[] {
  return [
    {
      name: "searchProducts",
      description:
        "Busca productos en el catálogo. Puedes buscar por texto (nombre, descripción, categoría, color) o filtrar por campos específicos.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              'Texto de búsqueda libre (ej: "camiseta roja", "deportivo", "pantalón")',
          },
          category: {
            type: "string",
            description: "Filtrar por categoría: Casual, Deportivo, Formal",
          },
          size: {
            type: "string",
            description: "Filtrar por talla: S, M, L, XL, XXL",
          },
          color: {
            type: "string",
            description:
              "Filtrar por color: Rojo, Azul, Verde, Negro, Blanco, Amarillo, Gris",
          },
        },
      },
    },
    {
      name: "getProductDetails",
      description:
        "Obtiene los detalles completos de un producto específico por su ID.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "integer",
            description: "ID numérico del producto (ej: 1, 32, 100)",
          },
        },
        required: ["productId"],
      },
    },
    {
      name: "createCart",
      description:
        "Crea un carrito de compras con los productos especificados. Usa esto cuando el cliente quiera comprar productos.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Lista de productos a agregar al carrito",
            items: {
              type: "object",
              properties: {
                product_id: {
                  type: "integer",
                  description: "ID del producto",
                },
                qty: {
                  type: "integer",
                  description: "Cantidad a comprar",
                },
              },
              required: ["product_id", "qty"],
            },
          },
        },
        required: ["items"],
      },
    },
    {
      name: "getCart",
      description:
        "Obtiene el carrito actual del cliente con todos los productos y el total.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "updateCart",
      description:
        "Actualiza el carrito: cambia cantidades o elimina productos (poniendo qty=0).",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Lista de cambios al carrito",
            items: {
              type: "object",
              properties: {
                product_id: {
                  type: "integer",
                  description: "ID del producto a modificar",
                },
                qty: {
                  type: "integer",
                  description: "Nueva cantidad (0 para eliminar)",
                },
              },
              required: ["product_id", "qty"],
            },
          },
        },
        required: ["items"],
      },
    },
    {
      name: "clearCart",
      description:
        "Elimina el carrito completo del cliente, empezando de cero.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  ]
}

/**
 * Execute a function call from Gemini
 */
export async function executeFunction(
  name: string,
  args: Record<string, unknown>,
  sessionId: string
): Promise<FunctionResult> {
  console.log(`🔧 Executing function: ${name}`)

  try {
    switch (name) {
      case "searchProducts":
        return await searchProducts(args as unknown as SearchProductsArgs)

      case "getProductDetails":
        return await getProductDetails(
          (args as { productId: number }).productId
        )

      case "createCart":
        return await createCart((args as unknown as CartArgs).items, sessionId)

      case "getCart":
        return await getCart(sessionId)

      case "updateCart":
        return await updateCart((args as unknown as CartArgs).items, sessionId)

      case "clearCart":
        return await clearCart(sessionId)

      default:
        return { error: `Función desconocida: ${name}` }
    }
  } catch (error) {
    console.error(`Error executing ${name}:`, error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Search products API call
 */
async function searchProducts({
  query,
  category,
  size,
  color,
}: SearchProductsArgs): Promise<FunctionResult> {
  const params = new URLSearchParams()
  if (query) {
    params.append("q", query)
  }
  if (category) {
    params.append("category", category)
  }
  if (size) {
    params.append("size", size)
  }
  if (color) {
    params.append("color", color)
  }
  params.append("available", "true")

  const url = `${API_BASE}/products?${params.toString()}`
  const response = await fetch(url)
  const data = (await response.json()) as ProductsListResponse

  if (data.count === 0) {
    return {
      message: "No se encontraron productos con esos criterios.",
      count: 0,
      products: [],
    }
  }

  const products = data.products.slice(0, 10).map((p) => ({
    id: p.id,
    nombre: `${p.name} ${p.size} ${p.color}`,
    precio: `$${p.price}`,
    stock: p.stock,
    categoria: p.category,
    descripcion: p.description,
  }))

  return {
    message: `Encontré ${data.count} productos${data.count > 10 ? " (mostrando los primeros 10)" : ""}.`,
    count: data.count,
    products,
  }
}

/**
 * Get product details API call
 */
async function getProductDetails(productId: number): Promise<FunctionResult> {
  const url = `${API_BASE}/products/${productId}`
  const response = await fetch(url)

  if (!response.ok) {
    return { error: "Producto no encontrado" }
  }

  const p = (await response.json()) as ProductApiResponse

  return {
    id: p.id,
    nombre: `${p.name} ${p.size} ${p.color}`,
    talla: p.size,
    color: p.color,
    precio_unitario: `$${p.price}`,
    precio_100_unidades: `$${p.price100}`,
    precio_200_unidades: `$${p.price200}`,
    stock_disponible: p.stock,
    categoria: p.category,
    descripcion: p.description,
    disponible: p.available ? "Sí" : "No",
  }
}

/**
 * Create cart API call
 */
async function createCart(
  items: CartItemArgs[],
  sessionId: string
): Promise<FunctionResult> {
  const url = `${API_BASE}/carts`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      sessionId: `whatsapp_${sessionId}`,
    }),
  })

  const data = (await response.json()) as CartApiResponse

  if (!response.ok) {
    return { error: data.error || "Error al crear carrito" }
  }

  return {
    message: "¡Carrito creado exitosamente!",
    cart_id: data.id,
    items: data.items.map((i) => ({
      producto: i.product_name,
      talla: i.size,
      color: i.color,
      cantidad: i.qty,
      subtotal: `$${i.subtotal}`,
    })),
    total: `$${data.total}`,
  }
}

/**
 * Get cart API call
 */
async function getCart(sessionId: string): Promise<FunctionResult> {
  const url = `${API_BASE}/carts/whatsapp_${sessionId}`
  const response = await fetch(url)

  if (!response.ok) {
    return {
      message:
        "No tienes un carrito activo. ¿Te gustaría ver nuestros productos?",
    }
  }

  const data = (await response.json()) as CartApiResponse

  if (data.items.length === 0) {
    return { message: "Tu carrito está vacío." }
  }

  return {
    cart_id: data.id,
    items: data.items.map((i) => ({
      producto: i.product_name,
      talla: i.size,
      color: i.color,
      cantidad: i.qty,
      precio_unitario: `$${i.unit_price}`,
      subtotal: `$${i.subtotal}`,
    })),
    total: `$${data.total}`,
  }
}

/**
 * Update cart API call
 */
async function updateCart(
  items: CartItemArgs[],
  sessionId: string
): Promise<FunctionResult> {
  const url = `${API_BASE}/carts/whatsapp_${sessionId}`
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  })

  const data = (await response.json()) as CartApiResponse

  if (!response.ok) {
    return { error: data.error || "Error al actualizar carrito" }
  }

  return {
    message: "¡Carrito actualizado!",
    cart_id: data.id,
    items: data.items.map((i) => ({
      producto: i.product_name,
      cantidad: i.qty,
      subtotal: `$${i.subtotal}`,
    })),
    total: `$${data.total}`,
  }
}

/**
 * Clear (delete) cart API call
 */
async function clearCart(sessionId: string): Promise<FunctionResult> {
  const url = `${API_BASE}/carts/whatsapp_${sessionId}`
  const response = await fetch(url, { method: "DELETE" })

  if (!response.ok) {
    return { message: "No tenías un carrito activo." }
  }

  return {
    message:
      "¡Carrito eliminado! Puedes empezar una nueva compra cuando quieras.",
  }
}
