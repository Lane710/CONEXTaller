export interface ProductoEnCarrito {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: string; // Usar el tipo BigDecimal si lo vas a manejar así, o 'number'
  marca: string;
  color: string;
  imagen: string;
  idCategoria: number;
  nombreCategoria: string;
}

export interface RawDetalleCarritoProducto {
  idDetalleCarrito: number;
  cantidad: number;
  precioUnitario: string; // Viene como string del backend
  subtotal: string;       // Viene como string del backend
  producto: ProductoEnCarrito; // Usamos la interfaz RawProductoEnCarrito aquí
  
 
}