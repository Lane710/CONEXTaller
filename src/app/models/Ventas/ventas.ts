import { forma_pago } from "../PedidosEnviosDetalles/forma_pago";
import { usuarios } from "../PersonModel/usuarios";
import { clientes } from "./clientes";


export interface ventas {
  idVenta?: number;                     // Long en Java → number en TS
  cliente: clientes;                   // Relación ManyToOne con clientes
  trabajador: usuarios | string;        // Puede ser el objeto completo o solo el username
  fechaVenta?: string;                 // LocalDate → string ISO (ej. "2025-09-24")
  horaVenta?: string;                  // LocalTime → string ISO (ej. "14:30:00")
  total: number;                       // BigDecimal → number
  descuento?: number;                  // BigDecimal → number, valor por defecto: 0
  notas?: string;                      // Texto libre
  formaPago: forma_pago;              // Relación ManyToOne con forma_pago
  estado?: 'COMPLETADA' | 'PENDIENTE' | 'CANCELADA' | 'DEVUELTA'; // Enum
}