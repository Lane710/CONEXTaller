import { usuarios } from '../PersonModel/usuarios';
import { detallePedido } from './detallePedido';
import { forma_pago } from './forma_pago';


export interface pedidos {
  idPedido?: number;                       // Long en Java → number en TS
  usuario: usuarios;                       // Relación con Usuario
  formaPago: forma_pago;                   // Relación ManyToOne con forma_pago
  fechaPedido?: string;                    // LocalDate → string ISO
  
  // <-- AÑADIDO
  horaRegistro?: string;                   // LocalTime → string ISO

  estado?: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO'; // Enum
  notas?: string;                          // Texto libre
  totalPedido?: number;                    // BigDecimal → number
  detalles?: detallePedido[];              // Relación OneToMany con detalle_pedido
  fechaModificacion?: string;              // LocalDate → string ISO (ya estaba)
  
  // <-- AÑADIDO
  horaModificacion?: string;               // LocalTime → string ISO
}