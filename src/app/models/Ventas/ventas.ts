import { clientes } from "./clientes";

export interface ventas {
  idVenta?: number; // 'Long' en Java se mapea a 'number' en TypeScript. Opcional.
  cliente: clientes; // Relación ManyToOne con 'clientes'. Aquí se usa la interfaz ICliente.
  usuarioTrabajador: string;
  fechaVenta?: string; // 'LocalDateTime' en Java se mapea a 'string' (ISO 8601) en TypeScript. Opcional por @PrePersist.
  total: number; // 'BigDecimal' en Java se mapea a 'number' en TypeScript.
  metodoPago?: string; // Opcional por @PrePersist.
  estado?: string; // Opcional por @PrePersist.
}