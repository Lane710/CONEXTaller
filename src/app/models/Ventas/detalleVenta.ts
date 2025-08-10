import { stock } from "../ProductoStockModel/stock";
import { ventas } from "./ventas";


export interface detalleVenta {
  idDetalleVenta?: number; // 'Long' en Java se mapea a 'number' en TypeScript. Opcional.
  venta?: ventas; // Relación ManyToOne con 'ventas'. Aquí se usa la interfaz IVenta.
  stock: stock; // Relación ManyToOne con 'stock'. Aquí se usa la interfaz IStock.
  cantidad: number;
  precioUnitario: number; // 'BigDecimal' en Java se mapea a 'number' en TypeScript para frontend.
  subtotal: number; // 'BigDecimal' en Java se mapea a 'number' en TypeScript para frontend.W
}