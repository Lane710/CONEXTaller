export interface SubcategoriaDTO {
  idSubcategoria: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  fechaCreacion: string; // ISO format
  idCategoria: number;
  nombreCategoria: string;
}