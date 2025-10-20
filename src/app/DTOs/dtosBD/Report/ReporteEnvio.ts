export interface ReporteEnvio {
  idEnvio: number;
  tipoOrigen: string;
  idOrigen: number;
  cliente: string;
  estado: string;
  metodoEnvio: string;
  costoEnvio: number;
  empresaEnvio: string;
  codigoSeguimiento: string;
  fechaCreacion: string;    // Corresponde a LocalDate
  fechaEnvio: string;       // Corresponde a LocalDate
  fechaEstimada: string;    // Corresponde a LocalDate
  fechaEntrega: string;     // Corresponde a LocalDate
}