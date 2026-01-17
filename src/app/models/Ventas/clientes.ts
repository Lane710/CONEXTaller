// src/app/models/PersonModel/clientes.ts

import { personas } from "../PersonModel/personas";


export interface clientes {
  // PK compartida con Persona
  ci: string; 
  
  // Campo específico de la tabla clientes
  razonSocial?: string; 
  
  // LocalDate -> "YYYY-MM-DD"
  fechaCreacion?: string; 
  
  estado?: boolean;

  // Relación OneToOne: Aquí es donde están nombre, apellidos, email, etc.
  persona?: personas; 
}