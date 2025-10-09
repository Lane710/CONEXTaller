
import { detallePedido } from './detallePedido';
import { forma_pago } from './forma_pago';


export interface pedidos {
  idPedido?: number;                         // Long en Java → number en TS
  username: string;                          // Relación con Usuario (solo el username)
  formaPago: forma_pago;                      // Relación ManyToOne con forma_pago
  fechaPedido?: string;                      // OffsetDateTime → string ISO
  estado?: 'PENDIENTE' | 'CONFIRMADO' | 'EN_PROCESO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'; // Enum
  notas?: string;                            // Texto libre
  totalPedido?: number;                      // BigDecimal → number
  detalles?: detallePedido[];                // Relación OneToMany con detalle_pedido
  fechaModificacion?: string;                // OffsetDateTime → string ISO
}