import { DireccionEnvioDTO } from "./DireccionEnvioDTO";
import { MetodoEnvioDTO } from "./MetodoEnvioDTO";

export interface EnvioDTO {
  idEnvio: number;
  codigoSeguimiento: string;
  estado: string;
  empresaEnvio: string;
  fechaEnvio: string; // ISO 8601 format
  fechaEntregaEstimada: string; // ISO 8601 format
  costoEnvio: number;
  nombreReceptor: string;
  apellidosReceptor: string;
  idPedido: number;
  direccionEnvio: DireccionEnvioDTO;
  metodoEnvio: MetodoEnvioDTO;
}
