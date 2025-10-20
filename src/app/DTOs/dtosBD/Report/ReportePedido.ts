export interface ReportePedido {
  idPedido: number;
  fechaPedido: string;      // Corresponde a LocalDate
  cliente: string;
  formaPago: string;
  estado: string;
  totalPedido: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}