// src/app/interfaces/categoria.ts (o donde guardes tus interfaces)

export interface categorias {
  idCategoria?: number;         // Se genera automáticamente en el backend
  nombre: string;               // Campo obligatorio
  descripcion?: string;         // Puede ser nulo
  urlImagen?: string;           // Puede ser nulo
  estado?: boolean;             // Valor por defecto: true
  fechaCreacion?: string;       // LocalDateTime en backend → string ISO en frontend
}