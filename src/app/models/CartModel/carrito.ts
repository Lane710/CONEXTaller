// Si tu ProductoEnCarrito usa Decimal, asegúrate de importarlo aquí también
// import Decimal from 'decimal.js'; // Solo si precioUnitario es de tipo Decimal

import { productos } from "../ProductoStockModel/productos";

export interface carrito {
    idCarrito?:number;
    usernameUsuario:string;
    cantidad: number;
    precioUnitario: number;
    fechaCreacion:string;
    fechaActualizacion:string;
    estado:boolean;

    producto?:productos;
}