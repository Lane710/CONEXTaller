// src/app/models/ProductModel/tipo.ts

import { subcategoria } from "./subcategorias";


export interface tipo {
  // PK: Long en Java -> number en TS
  idTipo?: number; 

  // Nombre del tipo (ej: "Laptops Gaming")
  nombre: string; 

  // Relación ManyToOne: El backend enviará el objeto Subcategoria
  // Usamos Partial para mayor flexibilidad al recibir/enviar datos
  subcategoria?: Partial<subcategoria>;
}