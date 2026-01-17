// src/app/models/VentaModel/ventas.ts
import { forma_pago } from "../PedidosEnviosDetalles/forma_pago";
import { usuarios } from "../PersonModel/usuarios";
import { clientes } from "./clientes";

export interface ventas {
  idVenta?: number;

  // Al ser EAGER o traer el objeto completo, usamos las interfaces
  cliente: clientes; 
  trabajador: usuarios; 

  // LocalDate -> "YYYY-MM-DD"
  fechaVenta?: string;
  // LocalTime -> "HH:mm:ss"
  horaVenta?: string;

  // BigDecimal -> number
  total: number;
  descuento?: number;

  notas?: string;

  // Usamos el objeto completo para coincidir con la relación ManyToOne
  formaPago: forma_pago; 

  // Union type idéntico al Enum de Java
  estado?: 'COMPLETADA' | 'PENDIENTE' | 'CANCELADA' | 'DEVUELTA';
}