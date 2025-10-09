import { productos } from "./productos"; // Asegúrate de que esta ruta sea correcta

export interface stock {
  idStock?: number;               // Long en Java → number en TS
  cantidad: number;               // Integer en Java → number en TS
  fechaActualizacion?: string;   // OffsetDateTime → string ISO
  producto: productos;           // Relación OneToOne con productos
}