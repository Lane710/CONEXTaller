import { usuarios } from "../PersonModel/usuarios";
import { categorias } from "./categorias";
import { proveedores } from "./proveedores";
import { subcategoria } from "./subcategorias";

export interface productos {
  idProducto?: number;
  nombre: string;
  descripcion?: string;
  precio?: number;
  precioCompra?: number;  // NUEVO CAMPO
  sku?: string | null;
  codigoBarras?: string | null;
  marca?: string;
  color?: string;
  estado?: number;
  imagen?: string | null;
  disponibleOnline?: boolean;

  // CAMBIO: Tipo y variante ahora son strings
  tipo?: string | null;
  variante?: string | null;

  // Relaciones
  categoria: categorias;
  subcategoria: subcategoria;
  proveedor: proveedores;
  usuarioRegistro?: usuarios;

  // Fechas
  fechaRegistro?: string;          // LocalDateTime → string ISO
  ultimaActualizacion?: string;    // LocalDateTime → string ISO
}