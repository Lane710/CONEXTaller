// Archivo: src/app/pipes/buscador-pedidos.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';
import { detallePedido } from '../../models/PedidosEnviosDetalles/detallePedido';
import { pedidos } from '../../models/PedidosEnviosDetalles/pedidos';

interface PedidoConDetalles {
  pedido: pedidos;
  detallePedidos: detallePedido[];
  isExpanded: boolean;
}
@Pipe({
  name: 'buscadorPedidos',
})
export class BuscadorPedidosPipe implements PipeTransform {
  /**
   * Transforma una lista de pedidos con sus detalles, filtrándolos por un término de búsqueda.
   * La búsqueda se realiza en el ID del pedido y el nombre del producto asociado.
   * @param pedidosConDetalles La lista de pedidos con detalles a filtrar.
   * @param searchTerm El término de búsqueda ingresado por el usuario.
   * @returns La lista de pedidos que coinciden con el término de búsqueda, ordenada por fecha.
   */
  transform(pedidosConDetalles: PedidoConDetalles[], searchTerm: string): PedidoConDetalles[] {
    if (!pedidosConDetalles || !searchTerm) {
      return this.sortByFechaReciente(pedidosConDetalles);
    }

    searchTerm = searchTerm.toLowerCase();

    const filteredList = pedidosConDetalles.filter((item) => {
      // Búsqueda por ID de pedido
      const idPedidoMatch = item.pedido.idPedido?.toString().includes(searchTerm);

      // Búsqueda por nombre de producto en los detalles del pedido
      const nombreProductoMatch = item.detallePedidos.some((detalle) =>
        detalle.producto?.nombre?.toLowerCase().includes(searchTerm)
      );

      return idPedidoMatch || nombreProductoMatch;
    });

    return this.sortByFechaReciente(filteredList);
  }

  /**
   * Ordena la lista de pedidos con detalles por la fecha del pedido más reciente.
   * @param list La lista a ordenar.
   * @returns La lista ordenada.
   */
  private sortByFechaReciente(list: PedidoConDetalles[]): PedidoConDetalles[] {
    return list.sort((a, b) => {
      const fechaA = a.pedido.fechaPedido ? new Date(a.pedido.fechaPedido).getTime() : 0;
      const fechaB = b.pedido.fechaPedido ? new Date(b.pedido.fechaPedido).getTime() : 0;
      return fechaB - fechaA;
    });
  }
}