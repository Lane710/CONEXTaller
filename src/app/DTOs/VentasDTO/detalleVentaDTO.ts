// src/app/models/detalle-venta-dto.ts

import { StockDTO } from "../Produc/StockDTO";
import { ventasDTO } from "./ventasDTO";


export interface detalleVentaDTO {
  idDetalleVenta: number;
  venta: ventasDTO;
  stock: StockDTO;
  cantidad: number;
  precioUnitario: number;
}
