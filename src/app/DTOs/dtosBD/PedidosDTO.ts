import { forma_pago } from "../../models/PedidosEnviosDetalles/forma_pago";
import { UsuarioDTO } from "./UsuarioDTO";

export interface PedidosDTO {
  idPedido: number;
  usuario: UsuarioDTO; // ya no es solo username
  estado: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';
  totalPedido: string; // BigDecimal → string
  fechaPedido: string; // LocalDate → string (ISO)
  
  // <-- AÑADIDO
  horaRegistro: string; // LocalTime -> string
  fechaModificacion: string; // LocalDate -> string
  horaModificacion: string; // LocalTime -> string

  formaPago: forma_pago; // nuevo subobjeto
}