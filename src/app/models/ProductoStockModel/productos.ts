// src/app/models/ProductModel/productos.ts
import { usuarios } from "../PersonModel/usuarios";
import { proveedores } from "./proveedores";

import { subcategoria } from "./subcategorias";
import { tipo } from "./tipo"; // Importante: Crear la interfaz Tipo

export interface productos {
  idProducto?: number;
  nombre: string;
  marca?: string;
  descripcion?: string;
  
  // Precios (BigDecimal -> number)
  precio: number; 
  precioCompra?: number;

  sku?: string;
  codigoBarras?: string;
  color?: string;
  
  // Campo que faltaba en el TS
  mesesGarantia?: number; 
  
  estado?: number; // Default 1
  imagen?: string;
  
  // En Java es String, en TS también
  variante?: string; 
  
  disponibleOnline?: boolean;

  // --- CAMBIO CLAVE: Relación Many-to-Many ---
  // En Java tienes Set<tipo> tiposAsignados, no un string simple.
  tiposAsignados?: tipo[];

  // --- RELACIONES ---
  // Nota: Si el backend solo tiene subcategoria, la categoria
  // se accede usualmente a través de producto.subcategoria.categoria
  subcategoria: subcategoria; 
  proveedor?: proveedores;
  usuarioRegistro?: Partial<usuarios>;

  // Fechas (LocalDateTime -> ISO String)
  fechaRegistro?: string;
  ultimaActualizacion?: string;
}