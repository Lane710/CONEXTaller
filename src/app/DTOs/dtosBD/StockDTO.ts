import { ProductoDTO } from "./ProductoDTO";


export interface StockDTO {
  idStock: number;
  cantidad: number;
  producto: ProductoDTO;
}