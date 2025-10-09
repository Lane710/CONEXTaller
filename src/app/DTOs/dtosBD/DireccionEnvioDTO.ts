export interface DireccionEnvioDTO {
  idDireccionEnvio: number;
  nombreDestinatario: string;
  apellidosDestinatario: string;
  numeroTelefono: string;
  emailDestinatario: string;
  direccion: string;
  barrio: string;
  ciudad: string;
  provinciaEstado: string;
  codigoPostal: string;
  pais: string;
  esPredeterminada: boolean;
}
