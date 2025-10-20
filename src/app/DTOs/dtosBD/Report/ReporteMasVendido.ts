export interface ReporteMasVendido {
  idProducto: number;
  nombre: string;
  sku: string;
  categoria: string;
  unidadesVendidas: number;
  ingresosTotales: number;
  stockActual: number;
}