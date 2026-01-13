import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../prisma/generated/prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("the DATABASE_URL environment variable is not defined")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export default prisma
