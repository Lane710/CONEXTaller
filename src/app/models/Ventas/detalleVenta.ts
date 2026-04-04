// src/app/models/VentaModel/detalleVenta.ts
import { productos } from '../ProductoStockModel/productos';
import { ventas } from './ventas';

export interface detalleVenta {
  idDetalleVenta?: number;

  // Relación ManyToOne: El backend enviará el objeto venta (con ignorados)
  venta: Partial<ventas>;

  // Relación con el producto directamente
  producto: productos;

  cantidad: number;

  precioBase: number;
  // BigDecimal -> number (Precio capturado al momento de la venta)
  precioUnitario: number;

  // Calculado por PostgreSQL (Sólo lectura desde el frontend)
  subtotal?: number;

  // NOTA: Si vas a usar descuento, debes agregarlo a la entidad detalleVentas.java
  descuento?: number;
}
