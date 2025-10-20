export interface ReporteMaestroProducto {
  idProducto: number;
  nombre: string;
  sku: string;
  estado: number;
  precio: number;
  precioCompra: number;
  categoria: string;
  proveedor: string;
  registradoPor: string;
  fechaRegistro: string;    // Corresponde a Instant (String ISO 8601)
}