# Diagrama de Flujo de Conversación

## Flujo Principal de Compra

```mermaid
sequenceDiagram
    actor Cliente
    participant WA as WhatsApp
    participant Agent as Agente IA
    participant API as API REST
    participant DB as PostgreSQL

    Note over Cliente,DB: 1. EXPLORACIÓN DE PRODUCTOS
    
    Cliente->>WA: "Hola, busco camisetas"
    WA->>Agent: Mensaje recibido
    Agent->>Agent: Analizar intención
    Agent->>API: GET /products?q=camisetas
    API->>DB: SELECT productos
    DB-->>API: Lista de camisetas
    API-->>Agent: JSON con productos
    Agent-->>WA: "Encontré N camisetas..."
    WA-->>Cliente: Lista de opciones

    Note over Cliente,DB: 2. VER DETALLES
    
    Cliente->>WA: "Muéstrame el producto 32"
    WA->>Agent: Mensaje recibido
    Agent->>API: GET /products/32
    API->>DB: SELECT producto id=32
    DB-->>API: Detalles del producto
    API-->>Agent: JSON con detalles
    Agent-->>WA: "Camiseta S Rojo, $1010..."
    WA-->>Cliente: Información completa

    Note over Cliente,DB: 3. CREAR CARRITO
    
    Cliente->>WA: "Quiero 3 unidades"
    WA->>Agent: Mensaje recibido
    Agent->>Agent: Detectar intención de compra
    Agent->>API: POST /carts {items:[{id:32, qty:3}]}
    API->>DB: INSERT cart, cart_items
    DB-->>API: Carrito creado
    API-->>Agent: JSON con carrito y total
    Agent-->>WA: "¡Carrito creado! Total: $3030"
    WA-->>Cliente: Confirmación

    Note over Cliente,DB: 4. MODIFICAR CARRITO (Extra)
    
    Cliente->>WA: "Cambia a 5 unidades"
    WA->>Agent: Mensaje recibido
    Agent->>API: PATCH /carts/:id {items:[{id:32, qty:5}]}
    API->>DB: UPDATE cart_items
    DB-->>API: Carrito actualizado
    API-->>Agent: JSON con nuevo total
    Agent-->>WA: "¡Actualizado! Nuevo total: $5050"
    WA-->>Cliente: Confirmación
```

## Estados del Carrito

```mermaid
stateDiagram-v2
    [*] --> SinCarrito: Cliente nuevo
    SinCarrito --> ConCarrito: createCart()
    ConCarrito --> ConCarrito: updateCart()
    ConCarrito --> SinCarrito: clearCart()
    ConCarrito --> [*]: Compra completada
    
    note right of SinCarrito: El cliente puede\nexplorar productos
    note right of ConCarrito: El cliente puede\nmodificar cantidades
```

## Tipos de Intenciones del Usuario

| Intención | Ejemplos | Acción del Agente |
|-----------|----------|-------------------|
| **Saludo** | "Hola", "Buenos días" | Dar bienvenida, preguntar qué busca |
| **Buscar** | "Busco pantalones", "Tienes algo deportivo?" | searchProducts() |
| **Detalles** | "Cuéntame del producto 15", "Qué tallas hay?" | getProductDetails() |
| **Comprar** | "Lo quiero", "Dame 2 unidades" | createCart() o updateCart() |
| **Ver carrito** | "Qué tengo en el carrito?" | getCart() |
| **Modificar** | "Cambia la cantidad", "Quita el producto" | updateCart(qty=0) |
| **Cancelar** | "Borra todo", "Empezar de nuevo" | clearCart() |

## Manejo de Errores

```mermaid
flowchart TD
    A[Mensaje del Cliente] --> B{¿Producto existe?}
    B -->|Sí| C{¿Hay stock?}
    B -->|No| D[Sugerir alternativas]
    C -->|Sí| E[Agregar al carrito]
    C -->|No| F[Informar sin stock]
    D --> G[Buscar productos similares]
    F --> G
    E --> H[Mostrar resumen]
    G --> H
```
