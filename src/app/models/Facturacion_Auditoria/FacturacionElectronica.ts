// src/app/models/InvoiceModel/facturacionElectronica.ts

import { Pedidos } from "../PedidosEnviosDetalles/pedidos";
import { ventas } from "../Ventas/ventas";


export interface FacturacionElectronica {
  idFactura?: number;

  // Relaciones OneToOne (llegan como objetos parciales)
  pedido?: Partial<Pedidos>;
  venta?: Partial<ventas>;

  cuf?: string; // Código Único de Factura (SIAT)
  numeroFacturaSiat?: number;
  total: number;
  leyenda?: string;
  urlQr?: string; // Para renderizar el QR en el frontend
  
  estado: 'emitida' | 'anulada' | string;

  // Logs técnicos del intercambio con el SIAT
  jsonEnviado?: string;
  jsonRecibido?: string;

  // Timestamp -> String ISO ("2026-01-11T19:15:00.000Z")
  fechaEmision?: string;
}