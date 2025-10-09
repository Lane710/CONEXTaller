import { personas } from './personas';
import { roles } from './roles';

export interface usuarios {
  username: string;              // Clave primaria, no se genera automáticamente
  passwordHash: string;          // Requerido para autenticación
  email: string;                 // Obligatorio y único
  fechaCreacion?: string;        // LocalDateTime → string ISO
  estado?: number;               // Valor por defecto: 1

  // Relaciones
  persona: personas;              // Relación con personas (por CI)
  rol: roles;                      // Relación con roles (por idRol)
}