import { ProductoDTO } from "./ProductoDTO";
import { VentasDTO } from "./VentasDTO";


export interface DetalleVentaDTO {
  idDetalleVenta: number;
  venta: VentasDTO;
  producto: ProductoDTO;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}