// src/app/models/ProductModel/productoValorPropiedad.ts
import { productos } from './productos';
import { tipoPropiedad } from './tipoPropiedad';

export interface ProductoValorPropiedad {
  // PK auto-generada
  idProductoValor?: number; 
  
  // Relación obligatoria: Define qué es (ej: "Material")
  tipoPropiedad: tipoPropiedad; 
  
  // El valor específico (ej: "Algodón")
  valor: string; 

  // Relación con el producto padre
  // Se usa Partial para evitar ciclos infinitos al serializar
  producto?: Partial<productos>; 
}