export interface ProductoPropiedad {
  idPropiedad?: number; // Es opcional porque el ID se genera en el backend con @GeneratedValue
  idProducto?: number;   // id_producto en Java se convierte a idProducto en camelCase
  tipo: string;         // Ej: "atributo", "caracteristica", "especificacion"
  nombre: string;
  valor: string;
}