import { ventas } from '../Ventas/ventas';
import { direccionesEnvio } from './direccionesEnvio';
import { metodoEnvio } from './metodosEnvio';
import { pedidos } from './pedidos';


export interface envios {
  idEnvio?: number;

  // Las dos relaciones opcionales. Un envío tendrá una o la otra, pero no ambas.
  pedido?: pedidos;
  venta?: ventas; // NUEVO: Se añade la relación opcional con 'ventas' para que coincida con el backend.

  direccionEnvio?: direccionesEnvio;
  metodoEnvio?: metodoEnvio;

  nombreReceptor: string;
  apellidosReceptor: string;
  telefonoReceptor?: string;
  emailReceptor?: string;

  empresaEnvio?: string;
  codigoSeguimiento?: string;

  estado?: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO' | 'DEVUELTO';

  fechaEnvio?: string;
  fechaEntregaEstimada?: string;
  fechaEntregaReal?: string;

  costoEnvio?: number;
  notas?: string;

  fechaCreacion?: string;
  fechaActualizacion?: string;
}
