import { DetalleCarritoProductoDTO } from "./DetalleCarritoProductoDTO";


export interface CarritoDTO {
  idCarrito: number;
  estado: boolean;
  fechaCreacion: string; // ISO 8601 format (OffsetDateTime)
  fechaActualizacion: string;
  usernameUsuario: string;
  total: string; // BigDecimal se representa como string para evitar pérdida de precisión
  detalles: DetalleCarritoProductoDTO[];
}