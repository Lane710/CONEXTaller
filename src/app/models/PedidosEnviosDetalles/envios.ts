
import { direccionesEnvio } from './direccionesEnvio';
//import { pedidos } from './pedidos';

export interface envios {
  idEnvio?: number;
  idPedido?: number;
  // La clave foránea idDireccionEnvio se reemplaza por el objeto completo
  // ya que el backend traerá la dirección completa si se carga la relación.
  direccionEnvio?: direccionesEnvio; 
  idMetodoEnvio: number;
  nombreReceptor: string;
  apellidosReceptor: string;
  telefonoReceptor: string;
  emailReceptor: string;
  empresaEnvio: string;
  codigoSeguimiento?: string;
  estado?: string;
  fechaEnvio?: string;
  fechaCreacion?:string;
  fechaEntregaEstimada?: string;
  //fechaEntregaReal?: string;
  costoEnvio?: number;
  notas: string;
}