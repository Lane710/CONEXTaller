// src/app/models/ProductModel/productoImagen.ts
import { productos } from './productos';

export interface ProductoImagen {
  // Coincide con id_imagen (Long)
  idImagen?: number; 

  // IMPORTANTE: El backend envía el objeto completo "producto", no solo el ID
  // Usamos Partial para evitar cargar todo el árbol de datos si no es necesario
  producto?: Partial<productos>; 

  // Coincide con url_imagen (TEXT)
  urlImagen: string; 

  // Coincide con orden (Integer)
  orden?: number; 
}