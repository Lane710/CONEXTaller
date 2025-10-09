// src/app/DTOs/Cart/DetalleCarritoProducto.ts

import { ProductoEnCarrito } from "../../DTOs/Cart/ProductoEnCarrito";
import { productos } from "../ProductoStockModel/productos";


export interface DetalleCarrito {
    idDetalleCarrito?: number;
    cantidad: number;
    precioUnitario: string; // Usa 'string' si el backend usa BigDecimal
    subtotal?: string;       // Usa 'string' si el backend usa BigDecimal
    // El objeto 'producto' ahora incluye la información de stock
    producto: ProductoEnCarrito;
}
