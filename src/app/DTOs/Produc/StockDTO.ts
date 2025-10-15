// src/app/models/stock-dto.ts (o la ruta que prefieras para tus DTOs)

import { ProductoDTO } from "../dtosBD/ProductoDTO";



export interface StockDTO {
  idStock: number; // Long en Java se mapea a number en TypeScript
  cantidad: number; // Integer en Java se mapea a number en TypeScript
  producto: ProductoDTO; // Referencia a la interfaz definida anteriormente
  anadidoAlCarrito?: boolean; // ¡Añade esta línea!
}