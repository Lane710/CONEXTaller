
import { direccionesEnvio } from './direccionesEnvio';
import { pedidos } from './pedidos';

export interface envios {
  idEnvio?: number;
  idPedido?: number;
  idDireccionEnvio?: number;
  idMetodoEnvio: number;
  nombreReceptor: string;
  apellidosReceptor: string;
  telefonoReceptor: string;
  emailReceptor: string;
  empresaEnvio: string;
  codigoSeguimiento?: string;
  estado?: string;
  fechaEnvio?: string;
  //fechaEntregaEstimada?: string;
  //fechaEntregaReal?: string;
  costoEnvio?: number;
  notas: string;
}
