import { CategoriaDTO } from "./CategoriaDTO";
import { ProveedorDTO } from "./ProveedorDTO";
import { SubcategoriaDTO } from "./SubcategoriaDTO";
import { UsuarioDTO } from "./UsuarioDTO";

export interface ProductoDTO {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  precioCompra: number;  // NUEVO CAMPO
  sku: string;
  codigoBarras: string;
  marca: string;
  color: string;
  estado: number;
  imagen: string;
  disponibleOnline: boolean;
  categoria: CategoriaDTO;
  subcategoria: SubcategoriaDTO;
  proveedor: ProveedorDTO;
  usuarioRegistro: UsuarioDTO;
  tipo: string;
  variante: string;
  fechaRegistro: string;
  ultimaActualizacion: string;
}