import { forma_pago } from "../../models/PedidosEnviosDetalles/forma_pago";
import { UsuarioDTO } from "./UsuarioDTO";

export interface PedidosDTO {
  idPedido: number;
  usuario: UsuarioDTO; // ya no es solo username
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'EN_PROCESO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  totalPedido: string; // BigDecimal → string
  fechaPedido: string; // LocalDate → string (ISO)
  formaPago: forma_pago; // nuevo subobjeto
}
