// src/app/models/stock-dto.ts (o la ruta que prefieras para tus DTOs)

import { ProductoEnCarrito } from "../Cart/ProductoEnCarrito";



export interface StockDTO {
  idStock: number; // Long en Java se mapea a number en TypeScript
  cantidad: number; // Integer en Java se mapea a number en TypeScript
  producto: ProductoEnCarrito; // Referencia a la interfaz definida anteriormente
}