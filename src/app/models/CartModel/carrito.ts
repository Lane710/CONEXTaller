// src/app/models/CartModel/carrito.ts

import { DetalleCarrito } from "./DetalleCarrito";

export interface Carrito {
    idCarrito?: number;
    usernameUsuario: string;
    fechaCreacion: string;
    fechaActualizacion: string;
    estado: boolean;

    // Ya no tiene cantidad ni precioUnitario directo
    detallesCarrito?: DetalleCarrito[];
}