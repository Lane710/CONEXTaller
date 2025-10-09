import { CategoriaDTO } from "./CategoriaDTO";
import { ProveedorDTO } from "./ProveedorDTO";
import { SubcategoriaDTO } from "./SubcategoriaDTO";
import { UsuarioDTO } from "./UsuarioDTO";

export interface ProductoDTO {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  sku: string;
  codigoBarras: string;
  marca: string;
  color: string;
  estado: number;
  imagen: string;
  proveedor: ProveedorDTO;
  usuarioRegistro: UsuarioDTO;
  fechaRegistro: string; // ISO format
  ultimaActualizacion: string; // ISO format
  disponibleOnline: boolean;
  categoria: CategoriaDTO;
  subcategoria: SubcategoriaDTO;
}