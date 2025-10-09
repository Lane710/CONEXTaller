export interface clientes {
  ci: string;               // En el backend es String, no number
  nombre: string;           // Obligatorio
  appaterno?: string;       // Opcional
  apmaterno?: string;       // Opcional
  email?: string;           // Opcional
  telefono?: string;        // Opcional
  direccion?: string;       // Opcional
}