export interface ProductoImagen {
  idImagen?: number;         // Long en Java → number en TS, opcional porque se genera en el backend
  productoId: number;        // Se usa el ID del producto (relación ManyToOne)
  urlImagen: string;         // Obligatorio
  orden?: number;            // Opcional si puede ser nulo
}