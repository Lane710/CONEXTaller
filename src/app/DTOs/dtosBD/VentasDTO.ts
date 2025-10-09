import { ClientesDTO } from "./ClientesDTO";


export interface VentasDTO {
  idVenta: number;
  cliente: ClientesDTO;
  usuarioTrabajador: string;
  fechaVenta: string; // ISO format (LocalDate)
  horaVenta: string;  // ISO format (LocalTime)
  total: number;
  descuento: number;
  formaPago: string;
  estado: string;
  notas: string;
}