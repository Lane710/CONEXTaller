export interface DetalleCarritoProductoDTO {
  idDetalleCarrito: number;
  idCarrito: number;
  idProducto: number;
  nombreProducto: string;
  skuProducto: string;
  marcaProducto: string;
  cantidad: number;
  precioUnitario: string; // BigDecimal → string
  subtotal: string;
  imagenProducto: string;
  productoDisponible: boolean;
}
