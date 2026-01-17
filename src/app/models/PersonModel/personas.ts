// src/app/models/PersonModel/personas.ts

export interface personas {
  // PK - Al ser String en Java, se maneja como string en TS
  ci: string; 

  nombre: string;
  apellidop: string; // Apellido Paterno
  apellidom: string; // Apellido Materno

  // Formato: "YYYY-MM-DD" gracias al @JsonFormat en Java
  fechaNacimiento?: string; 

  genero?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  codigoPostal?: string;
  fotoUrl?: string;
  // Formato ISO: "YYYY-MM-DDTHH:mm:ss"
  fechaRegistro?: string; 
}