// En tu archivo de interfaz del frontend (Ej: DireccionEnvioDTO.ts)

export interface DireccionEnvioDTO {
  idDireccionEnvio?: number; // Lo hago opcional ya que es autogenerado
  // ✅ CAMPO REQUERIDO
  username: string; 
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
  esPredeterminada?: boolean; // Hago opcional o le doy un valor por defecto
}