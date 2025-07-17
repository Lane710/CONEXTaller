// src/app/models/inventario.ts

import { productos } from "./productos"; // Asegúrate de que esta ruta sea correcta para tu modelo de productos

export interface stock { // Renombrado de 'inventario' a 'stock'
  // idStock es el ID del registro de stock. Es opcional porque el ID se genera en el backend.
  idStock?: number;
  cantidad: number;
  fechaActualizacion?: string; // LocalDateTime en Java -> string (ISO 8601) en TS. Opcional, el backend lo gestiona.
  // 'producto' es la referencia al producto al que pertenece este registro de stock.
  // Es requerido porque es una clave foránea y la relación @ManyToOne.
  producto: productos;
}