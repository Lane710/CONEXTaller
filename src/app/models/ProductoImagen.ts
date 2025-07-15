export interface ProductoImagen {
  idImagen: number;    // Es opcional porque el ID se genera en el backend con @GeneratedValue
  idProducto: number;   // id_producto en Java se convierte a idProducto en camelCase
  urlImagen: string;
  orden?: number;       // Puede ser opcional si es nulo en la DB
}