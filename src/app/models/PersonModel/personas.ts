export interface personas {
  ci: string;                      // Clave primaria, tipo String
  nombre: string;
  apellidop: string;
  apellidom: string;
  fechaNacimiento?: string;        // LocalDate → string ISO (ej. "1990-05-20")
  genero?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  codigoPostal?: string;
  fotoUrl?: string;
  fechaRegistro?: string;          // LocalDateTime → string ISO (ej. "2025-09-24T00:12:30")
}
