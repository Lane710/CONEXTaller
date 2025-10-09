export interface PedidosDTO {
  idPedido: number;
  username: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'; // Enum del backend
  totalPedido: string; // BigDecimal → string
  metodoPago: string;
  fechaPedido: string; // OffsetDateTime → string (ISO format)
}