

import { ProductoEnCarrito } from '../../DTOs/Cart/ProductoEnCarrito';
import { productos } from '../ProductoStockModel/productos';
import { pedidos } from './pedidos';


export interface detallePedido {
  idDetallePedido?: number;
  pedido: pedidos;
  producto?: ProductoEnCarrito;
  cantidad: number;
  precioUnitario: String;
  subtotal: String;
}
