// src/app/models/ProductModel/subcategoria.ts

import { categorias } from "./categorias";


export interface subcategoria {
  // PK: Long -> number
  idSubcategoria?: number; 
  
  // Campo obligatorio en el backend
  nombre: string; 
  
  descripcion?: string;
  
  // Backend lo inicializa en true por defecto
  estado?: boolean; 
  
  // LocalDateTime -> Recibido como String ISO ("2026-01-11T18:42:00")
  fechaCreacion?: string; 
  
  urlImagen?: string;

  // Relación ManyToOne: El backend enviará el objeto Categoria completo
  // Usamos Partial para evitar ciclos innecesarios
  categoria?: Partial<categorias>;
}