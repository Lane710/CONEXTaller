import { Pipe, PipeTransform } from '@angular/core';
import { stock } from '../../models/ProductoStockModel/stock';

@Pipe({
  name: 'filtrarProductosVenta'
})
export class FiltrarProductosVentaPipe implements PipeTransform {

  
  transform(items: stock[], searchTerm: string): stock[] {
    // Si no hay productos o no hay un término de búsqueda, devuelve la lista completa.
    if (!items || !searchTerm) {
      return items;
    }

    // Convierte el término de búsqueda a minúsculas para una búsqueda sin distinción entre mayúsculas y minúsculas.
    searchTerm = searchTerm.toLowerCase();

    // Filtra la lista de productos.
    return items.filter((item) => {
      // Accede al nombre del producto para la búsqueda.
      return item.producto.nombre.toLowerCase().includes(searchTerm);
    });
  }

}
