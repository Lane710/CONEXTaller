// src/app/DTOs/Carrito/ProductoEnCarritoDTO.ts

export interface ProductoEnCarrito {
    idProducto: number;
    nombre: string;
    descripcion: string;
    precio: string; // Coincide con BigDecimal del backend
    marca: string;
    color: string;
    imagen: string;
    idCategoria: number;
    nombreCategoria: string;
    idSubcategoria: number; // Corregido a 'number' para coincidir con el tipo Long del backend
    nombreSubcategoria: string; // Propiedad agregada para coincidir con el DTO del backend
}

// src/app/DTOs/Carrito/RawDetalleCarritoProducto.ts

// Esta interfaz representa la respuesta completa del backend
export interface RawDetalleCarritoProducto {
    idDetalleCarrito: number;
    cantidad: number;
    precioUnitario: string; // Viene como string del backend
    subtotal: string;       // Viene como string del backend
    
    // Usamos la interfaz de ProductoEnCarritoDTO aquí
    producto: ProductoEnCarrito; 
}
