import { usuarios } from "../PersonModel/usuarios";
import { proveedor } from "../proveedor";
import { categorias } from "./categorias";
import { subcategoria } from "./subcategorias";

export interface productos {
  idProducto?: number;
  nombre: string;
  descripcion?: string;
  precio?: number;
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
  proveedor: proveedor;
  usuarioRegistro?: usuarios;

  // Fechas
  fechaRegistro?: string;          // LocalDateTime → string ISO
  ultimaActualizacion?: string;    // LocalDateTime → string ISO
}