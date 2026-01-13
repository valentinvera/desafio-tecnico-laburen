# WhatsApp AI Agent - Laburen

Agente de inteligencia artificial para venta de productos por WhatsApp. Desarrollado como prueba técnica para Customer Success Engineer en Laburen.com.

## 🚀 Stack Tecnológico

- **Runtime**: Node.js >= 18
- **Lenguaje**: TypeScript
- **Framework**: Express.js
- **Base de datos**: PostgreSQL (Neon) + Prisma ORM v7
- **IA**: Google Gemini 2.5 Flash (function calling)
- **Mensajería**: Twilio WhatsApp Sandbox

## 📋 Requisitos

- Node.js >= 18
- PostgreSQL >= 13 (o cuenta en Neon.tech)
- Cuenta de Google AI Studio (API key de Gemini)
- Cuenta de Twilio (para WhatsApp Sandbox)

## ⚡ Instalación Rápida

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/valentinvera/desafio-tecnico-laburen
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
DATABASE_URL="postgresql://user:password@host:5432/database"
GEMINI_API_KEY="tu-api-key-de-gemini"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="tu-auth-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
PORT=4040
API_BASE_URL="http://localhost:4040"
```

## 📱 Configurar Twilio WhatsApp Sandbox

1. Ir a [Twilio Console](https://console.twilio.com)
2. Messaging → Try it out → Send a WhatsApp message
3. En **Sandbox Settings**, configurar webhook: `https://tu-app.onrender.com/webhook`
4. Para probar: enviar `join <code>` al número del sandbox

## 📡 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products` | Lista productos (filtro: `?q=`) |
| GET | `/products/:id` | Detalle de producto |
| POST | `/carts` | Crear carrito |
| GET | `/carts/:id` | Ver carrito |
| PATCH | `/carts/:id` | Actualizar carrito |
| DELETE | `/carts/:id` | Eliminar carrito |
| GET/POST | `/webhook` | WhatsApp webhook (Twilio) |

## 📁 Estructura del Proyecto

```
├── docs/                    # Documentación conceptual
│   ├── architecture.md      # Diagrama de arquitectura
│   └── flow-diagram.md      # Flujo de conversación
├── prisma/
│   ├── schema.prisma        # Modelo de datos
│   └── generated/           # Cliente Prisma generado
├── scripts/
│   └── import-products.ts   # Importador de Excel
├── src/
│   ├── agent/
│   │   ├── index.ts         # Agente principal (Gemini)
│   │   ├── tools.ts         # Herramientas/funciones
│   │   └── prompts.ts       # System prompt
│   ├── lib/
│   │   └── prisma.ts        # Cliente Prisma
│   ├── routes/
│   │   ├── products.ts      # API de productos
│   │   ├── carts.ts         # API de carritos
│   │   └── webhook.ts       # Webhook de Twilio
│   └── index.ts             # Servidor Express
├── products.xlsx            # Datos de productos
├── lefthook.yml             # Git hooks config
├── prisma.config.ts         # Prisma v7 config
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
2. En Render → New → Web Service
3. Conectar repositorio
4. Build Command: `npm install && npx prisma generate`
5. Start Command: `npm start`
6. Configurar Environment Variables

## 📖 Documentación

Ver carpeta `/docs` para:
- [Arquitectura del Sistema](docs/architecture.md)
- [Flujo de Conversación](docs/flow-diagram.md)

## 📄 Licencia

ISC
