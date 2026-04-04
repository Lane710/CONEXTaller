// src/app/models/PedidoModel/detallePedido.ts
import { productos } from '../ProductoStockModel/productos';
import { pedidos } from './pedidos';

export interface detallePedido {
  idDetallePedido?: number;

  // Como usas @JsonIgnoreProperties en Java, el objeto pedido llegará
  // pero sin su propia lista de detalles para evitar recursión.
  pedido: Partial<pedidos>;

  producto: productos;
  cantidad: number;
  precioUnitario: number;

  // Es opcional porque lo genera la base de datos
  subtotal?: number;

  // Union type para el Enum de Java
  estado:
    | 'PENDIENTE'
    | 'CONFIRMADO'
    | 'EN_PROCESO'
    | 'ENVIADO'
    | 'ENTREGADO'
    | 'CANCELADO';
  precioBase: number;
  // En Java es LocalDate, así que llegará como "YYYY-MM-DD"
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
