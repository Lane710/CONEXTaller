  // src/app/models/personas.ts

export interface personas { // Cambiado a PascalCase: Persona (singular)
  ci: string;              // ¡Importante! 'ci' es tu ID y no es @GeneratedValue, por lo que DEBE ser requerido al crear.
  nombre: string;
  apellidoP: string;       // Apellido paterno
  apellidoM: string;       // Apellido materno
  fechaNacimiento?: string; // LocalDate en Java -> string para 'YYYY-MM-DD'. Hago opcional porque puede ser null en tu entidad.
  genero?: string;
  telefono?: string;
  email?: string;          // Tu entidad lo tiene como unique, si no lo envías, podría ser null (si permites)
  direccion?: string;
  ciudad?: string;
  departamento?: string;   // Asegurado que coincida
  pais?: string;
  codigoPostal?: string;   // Asegurado que coincida
  fotoUrl?: string;
  fechaRegistro?: string;  // LocalDateTime en Java -> string. Opcional porque lo puede setear el backend.
}