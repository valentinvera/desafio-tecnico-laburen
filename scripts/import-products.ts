import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaPg } from "@prisma/adapter-pg"
import XLSX from "xlsx"
import { PrismaClient } from "../prisma/generated/prisma/client"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("the DATABASE_URL environment variable is not defined")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

interface ProductRow {
  ID?: string
  "﻿ID"?: string
  id?: string
  TIPO_PRENDA?: string
  tipo_prenda?: string
  TALLA?: string
  talla?: string
  COLOR?: string
  color?: string
  CANTIDAD_DISPONIBLE?: number
  cantidad_disponible?: number
  PRECIO_50_U?: number
  precio_50_u?: number
  PRECIO_100_U?: number
  precio_100_u?: number
  PRECIO_200_U?: number
  precio_200_u?: number
  DISPONIBLE?: string | boolean
  disponible?: string | boolean
  CATEGORÍA?: string
  CATEGORIA?: string
  categoría?: string
  categoria?: string
  DESCRIPCIÓN?: string
  DESCRIPCION?: string
  descripción?: string
  descripcion?: string
}

const parseProductRow = (row: ProductRow) => {
  const externalId = String(row.ID || row["﻿ID"] || row.id || "").padStart(
    3,
    "0"
  )
  const name = row.TIPO_PRENDA || row.tipo_prenda || "Unknown"
  const size = row.TALLA || row.talla || "M"
  const color = row.COLOR || row.color || "Unknown"
  const stock = Number.parseInt(
    String(row.CANTIDAD_DISPONIBLE || row.cantidad_disponible || 0),
    10
  )
  const price = Number.parseFloat(
    String(row.PRECIO_50_U || row.precio_50_u || 0)
  )
  const price100 = Number.parseFloat(
    String(row.PRECIO_100_U || row.precio_100_u || 0)
  )
  const price200 = Number.parseFloat(
    String(row.PRECIO_200_U || row.precio_200_u || 0)
  )
  const availableRaw = row.DISPONIBLE || row.disponible || "Sí"
  const available =
    availableRaw === "Sí" ||
    availableRaw === "Si" ||
    availableRaw === "sí" ||
    availableRaw === "si" ||
    availableRaw === true
  const category =
    row.CATEGORÍA ||
    row.CATEGORIA ||
    row.categoría ||
    row.categoria ||
    "General"
  const description =
    row.DESCRIPCIÓN ||
    row.DESCRIPCION ||
    row.descripción ||
    row.descripcion ||
    ""

  return {
    externalId,
    name,
    size,
    color,
    stock,
    price,
    price100,
    price200,
    available,
    category,
    description,
  }
}

const importProducts = async (): Promise<void> => {
  try {
    console.log("trying to import products...")

    // Read Excel file
    const filePath = join(__dirname, "..", "products.xlsx")
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const data: ProductRow[] = XLSX.utils.sheet_to_json(worksheet)

    console.log(`Found ${data.length} products in Excel file`)

    // Clear existing products
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.product.deleteMany()
    console.log("Cleared existing data")

    // Import each product
    let imported = 0
    let errors = 0

    for (const row of data) {
      try {
        // Parse row
        const productData = parseProductRow(row)

        await prisma.product.create({
          data: productData,
        })

        imported++
        if (imported % 20 === 0) {
          console.log(`Imported ${imported} products...`)
        }
      } catch (err) {
        console.error(
          "Error importing row:",
          row,
          err instanceof Error ? err.message : err
        )
        errors++
      }
    }

    console.log("Import complete!")
    console.log(`Imported: ${imported} products`)
    if (errors > 0) {
      console.log(`Errors: ${errors}`)
    }

    // Show sample of imported products
    const sample = await prisma.product.findMany({ take: 5 })
    for (const p of sample) {
      console.log(
        `  - [${p.externalId}] ${p.name} ${p.size} ${p.color} - $${p.price}`
      )
    }
  } catch (error) {
    console.error("Import failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importProducts()
