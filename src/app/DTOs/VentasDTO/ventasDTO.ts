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
  formaPago: string;
  estado?: string;
  detalles?: detalleVentaDTO[]; // opcional, si quieres incluir detalles dentro de la venta
  descuento:number;
  notas?:string;
}


export interface ReporteVentasPorCategoria {
  categoria: string;
  unidadesVendidas: number;
  totalIngresos: number;
}

export interface ReporteVentasDiaHora {
  fecha: string;
  horaDelDia: number;
  cantidadTransacciones: number;
  ingresosTotales: number;
}

export interface ReporteEstacionalidad {
  mes: number;
  ingresosAnioActual: number;
  ingresosAnioPasado: number;
  transaccionesAnioActual: number;
  transaccionesAnioPasado: number;
}

export interface ReporteEstado {
  origen: string;
  estado: string;
  cantidad: number;
  totalIngresos: number;
}

export interface ReporteMetodoPago {
  metodoPago: string;
  cantidadTransacciones: number;
  ingresosTotales: number;
}