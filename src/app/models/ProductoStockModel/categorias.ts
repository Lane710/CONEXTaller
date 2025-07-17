// src/app/interfaces/categoria.ts (o donde guardes tus interfaces)

export interface categoria { // Cambiado a PascalCase: Categoria
  idCategoria?: number ;      // Es opcional porque el ID se genera en el backend con @GeneratedValue
  nombre: string;
  descripcion?: string;      // Puede ser opcional si es nulo en la DB
  urlImagen?: string;        // Añadido según tu entidad de backend
  estado?: boolean;          // Añadido según tu entidad de backend (Boolean en Java -> boolean en TS)
  fechaCreacion?: string;    // Añadido según tu entidad de backend (LocalDateTime en Java -> string para ISO 8601)
}