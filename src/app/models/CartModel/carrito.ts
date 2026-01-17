// src/app/models/CartModel/carrito.ts
import { usuarios } from "../PersonModel/usuarios";
import { DetalleCarrito } from "./DetalleCarrito";


export interface Carrito {
    idCarrito?: number; 
    usuario: usuarios; 
    fechaCreacion?: string | Date; 
    fechaActualizacion?: string | Date;
    estado: boolean;
    detallesCarrito: DetalleCarrito[];
}