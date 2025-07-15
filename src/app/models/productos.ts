// src/app/models/productos.ts (ruta que uses para tus interfaces)


import { categoria } from "./categorias";
import { proveedor } from "./proveedor";

export interface productos {
  idProducto?: number; // <<-- ¡CORREGIDO! Hacemos 'idProducto' opcional.
  nombre: string;
  descripcion?: string;
  precio: number;
  sku?: string | null;
  codigoBarras?: string | null;
  marca?: string;
  color?: string;
  estado: number;
  imagen?: string | null; // Acepta null si no hay imagen
  disponibleOnline: boolean;

  categoria: categoria;
  idProveedor?: number | null; // <<-- ¡CORREGIDO! Coherencia con el componente y HTML
  idUsuarioRegistro?: string;

  fechaRegistro?: string;
  ultimaActualizacion?: string;
}