export interface ReporteBajoStock {
  idProducto: number;
  nombre: string;
  sku: string;
  categoria: string;
  stockActual: number;
  precioCompra: number;
  proveedor: string;
  telefonoProveedor: string;
}