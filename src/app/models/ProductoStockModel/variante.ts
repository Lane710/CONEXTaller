import { tipo } from "./tipo";

export interface variante {
  idVariante?: number;
  nombre?: string;
  tipo?: tipo; // Relación con tipo
}
