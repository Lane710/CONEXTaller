

// src/app/models/detallePedido/detallePedido.ts
import { ProductoEnCarrito } from '../../DTOs/Cart/ProductoEnCarrito';
//\mport { productos } from '../ProductoStockModel/productos';
import { pedidos } from './pedidos';


export interface detallePedido {
  idDetallePedido?: number;
  pedido: pedidos;
  producto?: ProductoEnCarrito;
  cantidad: number;
  precioUnitario: String;
  subtotal: String;
  estado?:String;
  fechaCreacion?:String;
}