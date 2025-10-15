import { categorias } from "./categorias";

export interface proveedores {
  idProveedor?: number;
  nombreEmpresa?: string;
  nombreContacto?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  ciudad?: string;
  pais?: string;
  estado?: boolean;
  fechaRegistro?: string;
  notas?: string;
  
  // 🆕 Nuevos campos para la relación con categoría
  categoria?: categorias;
  idCategoria?: number; // Para formularios simples
}