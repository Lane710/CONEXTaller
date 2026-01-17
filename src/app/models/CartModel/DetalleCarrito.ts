// src/app/models/CartModel/DetalleCarrito.ts
import { StockDTO } from "../../DTOs/dtosBD/StockDTO";

export interface DetalleCarrito {
    idDetalleCarrito?: number; 
    cantidad: number;
    precioUnitario: number; 
    subtotal?: number; 
    stock: StockDTO; 
}