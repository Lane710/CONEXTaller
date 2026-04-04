// src/app/models/PedidoModel/pedidos.ts
import { usuarios } from '../PersonModel/usuarios';
import { detallePedido } from './detallePedido';
import { forma_pago } from './forma_pago';

export interface pedidos {
  idPedido?: number;
  
  // Enviamos/recibimos el objeto usuario (usualmente solo el username en el POST)
  usuario: Partial<usuarios>; 
  codigoPedido?: string;
  
  // Relación obligatoria con la forma de pago
  formaPago: forma_pago;

  // Fechas (LocalDate -> "YYYY-MM-DD")
  fechaPedido?: string;
  fechaModificacion?: string;

  // Horas (LocalTime -> "HH:mm:ss")
  horaRegistro?: string;
  horaModificacion?: string;

  razonCancelacion?: string;

  // Union type para asegurar consistencia con el backend
  estado: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';

  notas?: string;

  // BigDecimal mapeado como number para cálculos
  totalPedido?: number;

  // Relación OneToMany: Lista de detalles
  // Gracias a @JsonIgnoreProperties("pedido"), evitamos el bucle infinito
  detalles: detallePedido[];
}