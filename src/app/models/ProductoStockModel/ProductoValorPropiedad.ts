import { productos } from './productos';
import { tipoPropiedad } from './tipoPropiedad';


export interface ProductoValorPropiedad {
  idProductoValor: number;
  tipoPropiedad: tipoPropiedad; // Sin "?" - hacerla obligatoria
  valor: string;
  producto?: productos;
}