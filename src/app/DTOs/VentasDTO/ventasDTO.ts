// src/app/models/ventas-dto.ts

import { ClienteDTO } from "./ClienteDTO";
import { detalleVentaDTO } from "./detalleVentaDTO";


export interface ventasDTO {
  idVenta: number;
  cliente: ClienteDTO;
  usuarioTrabajador: string;
  fechaVenta: string; // En frontend lo más común es usar ISO string para fechas
  horaVenta: string; // string formato "HH:mm:ss" o similar
  total: number;
  metodoPago: string;
  estado?: string;
  detalles?: detalleVentaDTO[]; // opcional, si quieres incluir detalles dentro de la venta
}
