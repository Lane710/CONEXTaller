
import { categorias } from "./categorias";
import { subcategoria } from "./subcategorias";

export interface productos {
  idProducto?: number;                 // Long en Java → number en TS
  nombre?: string;
  descripcion?: string;
  precio?: number;                      // BigDecimal → number
  sku?: string | null;
  codigoBarras?: string | null;
  marca?: string;
  color?: string;
  estado?: number;                    // Valor por defecto: 1
  imagen?: string | null;
  disponibleOnline?: boolean;         // Valor por defecto: true

  // Relaciones
  categoria: categorias;
  subcategoria?: subcategoria;

  // Datos del registro
  idProveedor?: number | null;        // Si no se carga el objeto proveedor completo
  idUsuarioRegistro?: string;         // Si no se carga el objeto usuario completo
  fechaRegistro?: string;             // LocalDateTime → string ISO
  ultimaActualizacion?: string;       // LocalDateTime → string ISO
}
