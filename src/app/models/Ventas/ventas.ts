import { usuarios } from "../PersonModel/usuarios";
import { clientes } from "./clientes";

export interface ventas {
  idVenta?: number;
  cliente: clientes; // Objeto cliente completo
  trabajador: usuarios; // 🔥 CAMBIADO: Ahora es objeto usuario completo, no string
  fechaVenta?: string;
  horaVenta?: string;
  total: number;
  descuento?: number;
  notas?: string;
  formaPago: {
    idFormaPago: number;
  };
  estado?: 'COMPLETADA' | 'PENDIENTE' | 'CANCELADA' | 'DEVUELTA';
}