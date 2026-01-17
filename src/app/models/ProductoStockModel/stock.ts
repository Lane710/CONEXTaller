// src/app/models/ProductModel/stock.ts
import { productos } from "./productos";

export interface stock {
  // PK auto-generada (Long -> number)
  idStock?: number; 
  
  // Cantidad física (Integer -> number)
  cantidad: number; 
  
  // OffsetDateTime llega como String ISO 8601 ("2026-01-11T18:41:00Z")
  fechaActualizacion?: string; 
  
  // Relación OneToOne
  // Al ser Lazy y tener JsonIgnoreProperties, recibiremos el producto
  // pero el producto NO traerá el stock de vuelta (evita recursión).
  producto: productos; 
}