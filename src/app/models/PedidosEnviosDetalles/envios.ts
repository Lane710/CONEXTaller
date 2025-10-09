
import { direccionesEnvio } from './direccionesEnvio';
import { metodoEnvio } from './metodosEnvio';
import { pedidos } from './pedidos';

export interface envios {
  idEnvio?: number;                         // Long en Java → number en TS
  pedido?: pedidos;                          // Relación OneToOne con pedidos
  direccionEnvio?: direccionesEnvio;         // Relación ManyToOne con direcciones_envio
  metodoEnvio?: metodoEnvio;                // Relación ManyToOne con metodos_envio

  nombreReceptor: string;
  apellidosReceptor: string;
  telefonoReceptor?: string;
  emailReceptor?: string;

  empresaEnvio?: string;
  codigoSeguimiento?: string;

  estado?: 'PENDIENTE' | 'PREPARANDO' | 'EN_TRANSITO' | 'EN_REPARTO' | 'ENTREGADO' | 'CANCELADO' | 'DEVUELTO';

  fechaEnvio?: string;                      // OffsetDateTime → string ISO
  fechaEntregaEstimada?: string;
  fechaEntregaReal?: string;

  costoEnvio?: number;                       // BigDecimal → number
  notas?: string;

  fechaCreacion?: string;
  fechaActualizacion?: string;
}
