export interface clientes {
  ci?: number; // 'Long' en Java se mapea a 'number' en TypeScript. Opcional porque es generado.
  nombre: string;
  appaterno?: string; // Puede ser nulo en Java, lo hacemos opcional en TS.
  apmaterno?: string; // Puede ser nulo en Java, lo hacemos opcional en TS.
  email?: string; //
  telefono?: string;
  direccion?: string;
}