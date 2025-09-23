// src/app/models/productos.ts (ruta que uses para tus interfaces)

// Importamos las interfaces que el backend está serializando
import { categoria } from "./categorias";
import { subcategoria } from "./subcategorias";


export interface productos {
  idProducto?: number;
  nombre: string;
  descripcion?: string;
  precio: number; // Cambio de 'number' a 'string' para coincidir con BigDecimal
  sku?: string | null;
  codigoBarras?: string | null;
  marca?: string;
  color?: string;
  estado: number;
  imagen?: string | null; 
  disponibleOnline: boolean;
  
  // Estas son las nuevas propiedades del DTO que coinciden con el backend
  categoria: categoria;
  subcategoria?: subcategoria;

  // Las siguientes propiedades están en el backend pero no son obligatorias para el DTO
  // ya que no siempre se necesitan para las operaciones del frontend.
  idProveedor?: number | null; 
  idUsuarioRegistro?: string;
  fechaRegistro?: string;
  ultimaActualizacion?: string;
}
