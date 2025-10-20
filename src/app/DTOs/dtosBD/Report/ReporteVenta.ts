export interface ReporteVenta {
  idVenta: number;
  fechaVenta: string;       // Corresponde a LocalDate
  horaVenta: string;        // Corresponde a LocalTime
  cliente: string;
  empleado: string;
  formaPago: string;
  estado: string;
  total: number;
  descuento: number;
  totalNeto: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}