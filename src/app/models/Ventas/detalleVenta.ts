import { productos } from "../ProductoStockModel/productos";
import { ventas } from "./ventas";

export interface detalleVenta {
  idDetalleVenta?: number;        // Long en Java → number en TS
  venta: ventas;                  // Relación ManyToOne con ventas
  producto: productos;            // Relación ManyToOne con productos
  cantidad: number;               // Integer en Java → number en TS
  precioUnitario: number;         // BigDecimal en Java → number en TS
  subtotal?: number;              // Generado en la DB, opcional en TS
  descuento?: number;
} 