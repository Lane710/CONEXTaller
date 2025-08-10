// src/app/models/cliente-dto.ts
export interface ClienteDTO {
  idCliente: number;
  nombre: string;
  apPaterno?: string;
  apMaterno?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}
