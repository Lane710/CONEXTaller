export interface clientes {
  idCliente?: number; // 'Long' en Java se mapea a 'number' en TypeScript. Opcional porque es generado.
  nombre: string;
  apPaterno?: string; // Puede ser nulo en Java, lo hacemos opcional en TS.
  apMaterno?: string; // Puede ser nulo en Java, lo hacemos opcional en TS.
  email?: string; //
  telefono?: string;
  direccion?: string;
}