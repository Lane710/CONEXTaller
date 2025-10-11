import { subcategoria } from "./subcategorias";

export interface tipo {
  idTipo?: number;
  nombre: string;
  subcategoria?: subcategoria; // Relación con la subcategoría
}
