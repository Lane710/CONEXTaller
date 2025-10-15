import { StockDTO } from "../../DTOs/dtosBD/StockDTO";


export interface DetalleCarrito {
    idDetalleCarrito?: number;
    cantidad: number;
    precioUnitario: string; // BigDecimal del backend como string
    subtotal?: string;       // BigDecimal del backend como string
    stock: StockDTO; // Ahora apunta al stock, que contiene el producto
}