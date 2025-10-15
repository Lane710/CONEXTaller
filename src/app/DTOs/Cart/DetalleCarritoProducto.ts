

import { StockDTO } from "../Produc/StockDTO";


export interface DetalleCarritoProducto {
  idDetalleCarrito: number;
  cantidad: number;
  precioUnitario: string; // Usar el tipo BigDecimal o 'number'
  subtotal: string; // Usar el tipo BigDecimal o 'number'
  stock: StockDTO;
}