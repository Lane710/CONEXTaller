// src/app/models/personas.ts
// Cambiado a PascalCase para seguir la convención de TypeScript
export interface personas { 
  ci: string; 
  nombre: string;
  apellidop: string; 
  apellidom: string; 
  fechaNacimiento?: string; // Corresponde a LocalDate
  genero?: string;
  telefono?: string;
  email?: string; 
  direccion?: string;
  ciudad?: string;
  departamento?: string; 
  pais?: string;
  codigoPostal?: string; 
  fotoUrl?: string;
  fechaRegistro?: string; // Corresponde a LocalDateTime
}