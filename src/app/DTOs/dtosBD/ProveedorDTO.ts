import { categorias } from "../../models/ProductoStockModel/categorias";

export interface ProveedorDTO {
  idProveedor: number;
  nombre: string;
  telefono: string;
  email: string;
  ciudad: string;
  categoria?: categorias;
}