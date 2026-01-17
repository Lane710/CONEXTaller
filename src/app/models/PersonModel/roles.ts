// src/app/models/PersonModel/roles.ts

export interface roles {
  // Coincide con BIGSERIAL de PostgreSQL y Long de Java
  idRol?: number; 

  // En Java es nullable = false y unique = true
  nombreRol: string; 

  // Tipo TEXT en Java se maneja como string en TS
  descripcion?: string;
}