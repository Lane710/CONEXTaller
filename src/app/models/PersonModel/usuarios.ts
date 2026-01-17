// src/app/models/PersonModel/usuarios.ts
import { personas } from './personas';
import { roles } from './roles';

export interface usuarios {
  // PK: Manual (no autoincremental)
  username: string; 
  
  // ¡CUIDADO!: Se recibe del backend solo si es necesario (ver sección de seguridad)
  passwordHash?: string; 
  
  email: string;
  
  // LocalDateTime -> "YYYY-MM-DDTHH:mm:ss"
  fechaCreacion?: string; 
  
  // Usualmente 1 para activo, 0 para inactivo
  estado?: number; 

  // Relaciones (Al ser EAGER en Java, el JSON traerá los objetos completos)
  persona: personas; 
  rol: roles; 
}