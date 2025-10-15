import { usuarios } from "../PersonModel/usuarios";

export interface direccionesEnvio {
  idDireccionEnvio?: number;         // Long en Java → number en TS
  usuario?: usuarios;                  // Relación con Usuario (solo el username)
  nombreDestinatario: string;        // Obligatorio
  apellidosDestinatario: string;     // Obligatorio
  numeroTelefono?: string;           // Opcional
  emailDestinatario?: string;        // Opcional
  direccion: string;                 // Obligatorio
  barrio: string;                    // Obligatorio
  ciudad: string;                    // Obligatorio
  provinciaEstado: string;           // Obligatorio
  codigoPostal: string;              // Obligatorio
  pais: string;                      // Obligatorio
  esPredeterminada?: boolean;        // Opcional, valor por defecto: false
  fechaCreacion?: string;            // OffsetDateTime → string ISO
  fechaActualizacion?: string;       // OffsetDateTime → string ISO
}