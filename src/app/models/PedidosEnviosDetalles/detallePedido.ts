import { productos } from '../ProductoStockModel/productos';
import { pedidos } from './pedidos';

export interface detallePedido {
  idDetallePedido?: number;         // Long en Java → number en TS
  pedido: pedidos;                  // Relación ManyToOne con pedidos
  producto: productos;              // Relación ManyToOne con productos
  cantidad: number;                 // Integer en Java → number en TS
  precioUnitario: number;          // BigDecimal en Java → number en TS
  subtotal?: number;               // Generado en la DB, opcional en TS
  estado?: 'PENDIENTE' | 'CONFIRMADO' | 'EN_PROCESO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'; // Enum en Java → union type en TS
  fechaCreacion?: string;          // OffsetDateTime en Java → string ISO en TS
  fechaActualizacion?: string;     // OffsetDateTime en Java → string ISO en TS
}