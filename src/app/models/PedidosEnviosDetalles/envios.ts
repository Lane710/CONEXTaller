// src/app/models/ShipmentModel/envios.ts
import { ventas } from '../Ventas/ventas';
import { direccionesEnvio } from './direccionesEnvio';
import { metodoEnvio } from './metodosEnvio';
import { pedidos } from './pedidos';

export interface envios {
  idEnvio?: number;

  // Relaciones OneToOne (Opcionales en la BD)
  // Partial se usa porque @JsonIgnoreProperties omitirá campos circulares
  pedido?: Partial<pedidos>;
  // venta?: Partial<ventas>;

  // Relaciones ManyToOne (Obligatorias en la BD: nullable = false)
  direccionEnvio: direccionesEnvio;
  metodoEnvio: Partial<metodoEnvio>;

  nombreReceptor: string;
  apellidosReceptor: string;
  telefonoReceptor?: string;
  emailReceptor?: string;

  empresaEnvio?: string;
  codigoSeguimiento?: string;

  // Union type exacto al Enum de Java
  estado?: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO' | 'DEVUELTO';

  // En Java usas LocalDate, el JSON llegará como "YYYY-MM-DD"
  fechaEnvio?: string;
  fechaEntregaEstimada?: string;
  fechaEntregaReal?: string;

  // BigDecimal -> number
  costoEnvio: number;
  notas?: string;

  fechaCreacion?: string;
  fechaActualizacion?: string;
}