// src/app/DTOs/facturacion/factura-emitida-response.ts

export interface FacturaEmitidaResponse {
  idFactura: number;
  estado: string;
  numeroFacturaSiat: number;
  cuf: string;
  urlQr: string;
  total: number;
}