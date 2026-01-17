// src/app/models/ProductModel/categoria.ts

export interface categorias {
  // PK: Se genera en el servidor
  idCategoria?: number; 
  
  // Obligatorio y único en el backend
  nombre: string; 
  
  descripcion?: string;
  
  // Mapeado de url_imagen (Snake Case en DB -> Camel Case en Java/TS)
  urlImagen?: string; 
  
  // Backend lo inicializa en true por defecto
  estado?: boolean; 
  
  // LocalDateTime -> Recibido como String ISO ("2026-01-11T18:34:44")
  fechaCreacion?: string; 
}