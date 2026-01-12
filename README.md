# WhatsApp AI Agent - Laburen

Agente de inteligencia artificial para venta de productos por WhatsApp. Desarrollado como prueba técnica para Customer Success Engineer en Laburen.com.

## 🚀 Stack Tecnológico

- **Runtime**: Node.js >= 18
- **Lenguaje**: TypeScript
- **Framework**: Express.js
- **Base de datos**: PostgreSQL + Prisma ORM
- **IA**: Google Gemini 1.5 Flash (function calling)
- **Mensajería**: WhatsApp Cloud API (Meta)

## 📋 Requisitos

- Node.js >= 18
- PostgreSQL >= 13
- Cuenta de Google AI Studio (API key de Gemini)
- Meta Business Account con WhatsApp Cloud API

## ⚡ Instalación Rápida

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd desafio-tecnico-laburen
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Configurar base de datos
npm run db:push
npm run db:generate

# 4. Importar productos
npm run import-products

# 5. Iniciar servidor
npm run dev
```

## 🔧 Configuración

Edita el archivo `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/laburen"
GEMINI_API_KEY="tu-api-key-de-gemini"
WHATSAPP_TOKEN="tu-token-de-whatsapp"
WHATSAPP_PHONE_NUMBER_ID="tu-phone-id"
WHATSAPP_VERIFY_TOKEN="un-token-secreto"
PORT=3000
API_BASE_URL="http://localhost:3000"
```

## 📡 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products` | Lista productos (filtro: `?q=`) |
| GET | `/products/:id` | Detalle de producto |
| POST | `/carts` | Crear carrito |
| GET | `/carts/:id` | Ver carrito |
| PATCH | `/carts/:id` | Actualizar carrito |
| DELETE | `/carts/:id` | Eliminar carrito |
| GET/POST | `/webhook` | WhatsApp webhook |

## 📁 Estructura del Proyecto

```
├── docs/                    # Documentación conceptual
│   ├── architecture.md      # Diagrama de arquitectura
│   └── flow-diagram.md      # Flujo de conversación
├── prisma/
│   └── schema.prisma        # Modelo de datos
├── scripts/
│   └── import-products.ts   # Importador de Excel
├── src/
│   ├── agent/
│   │   ├── index.ts         # Agente principal (Gemini)
│   │   ├── tools.ts         # Herramientas/funciones
│   │   └── prompts.ts       # System prompt
│   ├── routes/
│   │   ├── products.ts      # API de productos
│   │   ├── carts.ts         # API de carritos
│   │   └── webhook.ts       # Webhook de WhatsApp
│   └── index.ts             # Servidor Express
├── products.xlsx            # Datos de productos
├── render.yaml              # Blueprint para Render
└── package.json
```

## 🤖 Capacidades del Agente

El agente puede:
- 🔍 Buscar productos por nombre, categoría, talla, color
- 📦 Mostrar detalles de productos específicos
- 🛒 Crear y gestionar carritos de compra
- ✏️ Modificar cantidades en el carrito
- 🗑️ Eliminar productos del carrito

## 🌐 Despliegue en Render

1. Subir código a GitHub
2. En Render → New → Blueprint
3. Conectar repositorio (usará `render.yaml`)
4. Configurar Environment Variables

## 📖 Documentación

Ver carpeta `/docs` para:
- [Arquitectura del Sistema](docs/architecture.md)
- [Flujo de Conversación](docs/flow-diagram.md)

## 📄 Licencia

ISC
