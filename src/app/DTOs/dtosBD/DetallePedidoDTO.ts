export interface DetallePedidoDTO {
  idDetallePedido: number;
  idPedido: number;
  idProducto: number;
  nombreProducto: string;
  skuProducto: string;
  imagenProducto: string;
  cantidad: number;
  precioUnitario: string; // BigDecimal → string
  subtotal: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'; // Enum del backend
  fechaCreacion: string; // OffsetDateTime → string (ISO format)
  fechaActualizacion: string;
}
