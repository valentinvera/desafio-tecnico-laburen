import path from "node:path"
import { config } from "dotenv"
import { defineConfig } from "prisma/config"

config()

export default defineConfig({
  schema: path.join(import.meta.dirname ?? ".", "prisma/schema.prisma"),
})
