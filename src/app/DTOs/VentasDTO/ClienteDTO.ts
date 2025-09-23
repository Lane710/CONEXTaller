// src/app/models/cliente-dto.ts
export interface ClienteDTO {
  ci: number;
  nombre: string;
  appaterno?: string;
  apmaterno?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}
