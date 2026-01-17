// src/app/models/PersonModel/direccionesEnvio.ts
import { usuarios } from "../PersonModel/usuarios";

export interface direccionesEnvio {
  idDireccionEnvio?: number; 
  
  // En el backend es obligatorio (nullable = false)
  // Usamos Partial porque a veces desde el front solo mandamos el username
  usuario: Partial<usuarios>; 

  nombreDestinatario: string;
  apellidosDestinatario: string;
  
  // Opcionales en Java (sin nullable = false)
  numeroTelefono?: string;
  emailDestinatario?: string;
  
  direccion: string;
  barrio: string;
  ciudad: string;
  provinciaEstado: string;
  codigoPostal: string;
  pais: string;
  
  // El backend lo inicializa en false si viene nulo
  esPredeterminada?: boolean; 
  
  // OffsetDateTime llega como String ISO 8601: "2026-01-11T18:22:20Z"
  fechaCreacion?: string;
  fechaActualizacion?: string;
}