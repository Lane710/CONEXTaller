import { productos } from './productos';
import { tipoPropiedad } from './tipoPropiedad';


export interface ProductoValorPropiedad {
  idProductoValor?: number;         // Long en Java → number en TS
  producto?: productos;              // Relación ManyToOne con productos
  tipoPropiedad?: tipoPropiedad;     // Relación ManyToOne con tipoPropiedad
  valor?: string;                    // Texto libre
}