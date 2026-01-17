// src/app/models/ProductModel/movimientosInventario.ts

import { usuarios } from "../PersonModel/usuarios";
import { stock } from "./stock";


export interface MovimientosInventario {
  idMovimiento?: number;

  // Relación con la cabecera de stock del producto
  stock: Partial<stock>;

  /**
   * ENTRADA: Compra o devolución de cliente
   * SALIDA: Venta o baja por daño
   * AJUSTE: Corrección manual de inventario
   * RESERVA: Apartado para pedido pendiente
   */
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'RESERVA';

  // Cantidad que se suma o resta (se recomienda manejar siempre positivos 
  // y dejar que el tipoMovimiento defina la operación)
  cantidad: number;

  // Número de factura, orden de compra o código de ajuste
  referenciaDoc?: string;

  // OffsetDateTime -> String ISO ("2026-01-11T19:10:00Z")
  fechaMovimiento?: string;

  // Quién realizó el movimiento
  usuario?: Partial<usuarios>;
}