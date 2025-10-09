
import { ProductoDTO } from "../dtosBD/ProductoDTO";


export interface DetalleCarritoProducto {
  idDetalleCarrito: number;
  cantidad: number;
  precioUnitario: string; // Usar el tipo BigDecimal o 'number'
  subtotal: string; // Usar el tipo BigDecimal o 'number'
  producto: ProductoDTO;
}