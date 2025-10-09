import { categorias } from './categorias'; // Si estás usando el objeto completo

export interface subcategoria {
  idSubcategoria?: number;         // Long en Java → number en TS
  nombre: string;
  descripcion?: string;
  estado?: boolean;                // Valor por defecto: true
  fechaCreacion?: string;          // LocalDateTime → string ISO
  urlImagen ?: string;
  // Si el backend devuelve el objeto completo:
  categoria?: categorias;
}
  // Alternativa si solo se usa el ID:
  // idCategoria?: number;
