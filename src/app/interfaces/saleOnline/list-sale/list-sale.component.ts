import { Component, OnInit, AfterViewInit } from '@angular/core';
import { PedidosService } from '../../../services/PedidosEnviosDetalles/pedidos.service';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { detallePedido } from '../../../models/PedidosEnviosDetalles/detallePedido';
import { DetallePedidosService } from '../../../services/PedidosEnviosDetalles/detalle-pedidos.service';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { forkJoin, of, lastValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BuscadorPedidosPipe } from '../../../pipes/pedidos/buscador-pedidos.pipe';

declare var bootstrap: any;

// Definimos una interfaz que combina pedidos y detalles, y le agregamos la propiedad 'isExpanded' para el UI
interface PedidoConDetalles {
  pedido: pedidos;
  detallePedidos: detallePedido[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-list-pedido',
  standalone: true,
  imports: [NgFor, FormsModule, NgClass, NgIf, DatePipe,BuscadorPedidosPipe],
  templateUrl: './list-sale.component.html',
  styleUrl: './list-sale.component.css'
})
export class ListPedidoComponent implements OnInit, AfterViewInit {

  pedidos: pedidos[] = [];
  pedidosOriginal: pedidos[] = [];
  paginatedPedidosConDetalles: PedidoConDetalles[] = [];
  allPedidosConDetalles: PedidoConDetalles[] = [];
  filteredPedidosConDetalles: PedidoConDetalles[] = [];

  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;
  pages: number[] = [];
  searchTerm: string = '';

  pedidoSeleccionado: pedidos | null = null;
  ListaDetallePedidoSelec: detallePedido[] = [];
  estadoSeleccionado: string = '';

  // Lista para almacenar los productos temporalmente seleccionados para cancelar
  ListaProductoCancelar: detallePedido[] = [];
  // Usamos un Set para un acceso rápido y evitar duplicados
  private productosEnProcesoDeCancelacion = new Set<number>();
  
  constructor(
    private pedidosS: PedidosService,
    private detallePedidoS: DetallePedidosService,
    private stockS: StockService
  ) { }

  ngOnInit(): void {
    this.listadoPedidos();
  }

  // Después de que la vista se inicializa, configuramos el listener para el modal.
  ngAfterViewInit(): void {
    const modalElement = document.getElementById('modalConfirmarCancelacion');
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.restablecerListasTemporales();
      });
    }
  }

  /**
   * @description Obtiene la lista de pedidos desde el servicio y actualiza la paginación.
   */
  listadoPedidos(): void {
    this.pedidosS.finAll().subscribe({
      next: (response) => {
        this.pedidosOriginal = response.data;
        this.pedidos = [...this.pedidosOriginal];
        this.ordenarPorFechaReciente();
        this.getAllDetallesPedidos(this.pedidos);
      },
      error: (error) => {
        console.error('Error al obtener pedidos:', error);
      }
    });
  }

  /**
   * @description Carga los detalles de todos los pedidos, añade la propiedad isExpanded y luego actualiza la paginación.
   * @param pedidos Los pedidos de la página actual.
   */
  getAllDetallesPedidos(pedidos: pedidos[]): void {
    const promises = pedidos.map(pedido =>
      lastValueFrom(this.detallePedidoS.getById(pedido.idPedido || 0)).then(response => {
        return {
          pedido: pedido,
          detallePedidos: response?.data || [],
          isExpanded: false
        } as PedidoConDetalles;
      })
    );

    Promise.all(promises).then(allDetails => {
      this.allPedidosConDetalles = allDetails.filter(item => item !== null) as PedidoConDetalles[];
      this.filteredPedidosConDetalles = [...this.allPedidosConDetalles];
      this.updatePagination();
    }).catch(error => {
      console.error('Error al obtener todos los detalles de los pedidos:', error);
    });
  }

  /**
   * @description Actualiza la lógica de paginación (número de páginas y pedidos paginados).
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPedidosConDetalles.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.goToPage(1);
  }

  /**
   * @description Cambia a una página específica.
   * @param page El número de página al que ir.
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.paginatedPedidosConDetalles = this.filteredPedidosConDetalles.slice(startIndex, endIndex);
    }
  }

  /**
   * @description Ordena los pedidos por fecha más reciente.
   */
  ordenarPorFechaReciente(): void {
    this.pedidos.sort((a, b) => {
      const fechaA = a.fechaPedido ? new Date(a.fechaPedido).getTime() : 0;
      const fechaB = b.fechaPedido ? new Date(b.fechaPedido).getTime() : 0;
      return fechaB - fechaA;
    });
    this.getAllDetallesPedidos(this.pedidos);
  }

  /**
   * @description Ordena los pedidos por fecha más antigua.
   */
  ordenarPorFechaAntigua(): void {
    this.pedidos.sort((a, b) => {
      const fechaA = a.fechaPedido ? new Date(a.fechaPedido).getTime() : 0;
      const fechaB = b.fechaPedido ? new Date(b.fechaPedido).getTime() : 0;
      return fechaA - fechaB;
    });
    this.getAllDetallesPedidos(this.pedidos);
  }

  /**
   * @description Filtra los pedidos usando el término de búsqueda.
   */
  onSearch(): void {
    if (!this.searchTerm) {
      this.filteredPedidosConDetalles = [...this.allPedidosConDetalles];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredPedidosConDetalles = this.allPedidosConDetalles.filter((pedidoConDetalles) => {
        const pedidoIdStr = `ped${pedidoConDetalles.pedido.idPedido}`.toLowerCase();
        if (pedidoIdStr.includes(term)) {
          return true;
        }

        return pedidoConDetalles.detallePedidos.some((detalle) => {
          const productName = detalle.producto?.nombre?.toLowerCase();
          return productName && productName.includes(term);
        });
      });
    }
    this.updatePagination();
  }

  /**
   * @description Selecciona un pedido para mostrar sus detalles en un modal.
   * @param item El objeto que contiene el pedido y sus detalles.
   */
  selectPedidoModalDetalle(item: PedidoConDetalles): void {
    this.pedidoSeleccionado = item.pedido;
    this.ListaDetallePedidoSelec = item.detallePedidos;
  }

  /**
   * @description Abre el modal para cambiar el estado de un pedido.
   * @param pedido El pedido cuyo estado se va a cambiar.
   */
  abrirModalCambiarEstado(pedido: pedidos): void {
    this.pedidoSeleccionado = pedido;
    this.estadoSeleccionado = pedido.estado || '';
    const modalElement = document.getElementById('modalCambiarEstado');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  /**
   * @description Confirma el cambio de estado del pedido y llama al servicio.
   */
  confirmarCambioEstado(): void {
    if (this.pedidoSeleccionado && this.estadoSeleccionado && this.pedidoSeleccionado.idPedido) {
      this.pedidosS.actualizarEstado(this.pedidoSeleccionado.idPedido, this.estadoSeleccionado).subscribe({
        next: (response) => {
          console.log('Estado del pedido actualizado con éxito:', response);

          const modalElement = document.getElementById('modalCambiarEstado');
          if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            }
          }
          this.listadoPedidos();
        },
        error: (error) => {
          console.error('Error al actualizar el estado del pedido:', error);
        }
      });
    }
  }

  /**
   * @description Abre el modal para cancelar un pedido y obtiene sus detalles.
   * @param pedido El pedido a cancelar.
   */
  abrirModalCancelarPedido(pedido: pedidos): void {
    this.pedidoSeleccionado = pedido;
    this.ListaProductoCancelar = [];
    this.productosEnProcesoDeCancelacion.clear();

    lastValueFrom(this.detallePedidoS.getById(pedido.idPedido || 0)).then(response => {
      this.ListaDetallePedidoSelec = response.data;
      const modalElement = document.getElementById('modalConfirmarCancelacion');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }).catch(error => {
      console.error('Error al obtener los detalles del pedido para la cancelación:', error);
    });
  }

  /**
   * @description Añade un producto a la lista de cancelación si no ha sido seleccionado.
   * @param detalle El producto a cancelar.
   */
  cancelarProductoDePedido(detalle: detallePedido): void {
    if (detalle.idDetallePedido && !this.productosEnProcesoDeCancelacion.has(detalle.idDetallePedido)) {
      // Modificamos el estado del producto en la lista temporal
      detalle.estado = 'CANCELADO';
      this.ListaProductoCancelar.push(detalle);
      this.productosEnProcesoDeCancelacion.add(detalle.idDetallePedido);
      console.log(`Producto ${detalle.producto?.nombre} añadido a la lista de cancelación.`);
    }
  }

  /**
   * @description Confirma la cancelación de los productos seleccionados y actualiza el pedido.
   */
  async confirmarCancelacion(): Promise<void> {
    if (!this.pedidoSeleccionado || !this.pedidoSeleccionado.idPedido) {
      console.error('No se ha seleccionado un pedido válido.');
      return;
    }

    let totalReduccion = 0;
    const productosCancelados = this.ListaProductoCancelar;
    const updateObservables: any[] = [];
    
    // Paso 1: Actualizar el stock y el estado de cada detalle de pedido
    for (const detalle of productosCancelados) {
      if (detalle.producto && detalle.producto.idProducto && detalle.cantidad) {
        // Obtenemos el ID del stock y luego actualizamos la cantidad
        const stockUpdate$ = this.stockS.StockDelProducto(detalle.producto.idProducto).pipe(
          switchMap((stockResponse) => {
            if (stockResponse?.data) {
              const stockData = stockResponse.data;
            
              // Aumentamos el stock y actualizamos el estado del detalle del pedido
              return forkJoin([
                this.stockS.addorRestarStockProductos(stockData, detalle.cantidad),
                this.detallePedidoS.save({ ...detalle, estado: 'CANCELADO' })
              ]);
            } else {
              console.warn(`No se encontró stock para el producto con ID: ${detalle.producto?.idProducto}.`);
              return of(null);
            }
          })
        );
        updateObservables.push(stockUpdate$);
        totalReduccion += (Number(detalle.precioUnitario) || 0) * Number(detalle.cantidad);
      }
    }

    try {
      // Usamos lastValueFrom para convertir el Observable a una Promise
      await lastValueFrom(forkJoin(updateObservables));
      console.log('Stocks y detalles de pedido actualizados con éxito.');

      // Paso 2: Recalcular el total del pedido principal y actualizar su estado
      const totalActual = parseFloat(this.pedidoSeleccionado.totalPedido as string || '0');
      const nuevoTotal = totalActual - totalReduccion;
      this.pedidoSeleccionado.totalPedido = nuevoTotal.toFixed(2);

      // Eliminar los productos cancelados de la lista de detalles del pedido
      const idsCancelados = new Set(productosCancelados.map(p => p.idDetallePedido));
      this.ListaDetallePedidoSelec = this.ListaDetallePedidoSelec.filter(d => !idsCancelados.has(d.idDetallePedido));
      
      // Si no quedan productos, cambiar el estado del pedido principal
      if (this.ListaDetallePedidoSelec.length === 0) {
        this.pedidoSeleccionado.estado = 'CANCELADO';
      }

      // Paso 3: Guardar el pedido principal actualizado
      if (this.pedidoSeleccionado.idPedido) {
        console.log(this.pedidoSeleccionado)
        await lastValueFrom(this.pedidosS.update(this.pedidoSeleccionado.idPedido, this.pedidoSeleccionado));
        console.log('Pedido principal actualizado con éxito.');
      }

      this.cerrarModalYRefrescar();
    } catch (error) {
      console.error('Error en el proceso de cancelación:', error);
    }
  }

  /**
   * @description Cierra el modal y refresca la lista de pedidos.
   */
  private cerrarModalYRefrescar(): void {
    const modalElement = document.getElementById('modalConfirmarCancelacion');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.listadoPedidos();
  }

  /**
   * @description Resetea las listas temporales del pedido para la cancelación.
   * Se llama cuando el modal se cierra, sin importar cómo.
   */
  restablecerListasTemporales(): void {
    // Limpia todas las listas temporales para evitar estados no deseados
    
    console.log(this.productosEnProcesoDeCancelacion)

    for (const detalleSeleccionado of this.ListaDetallePedidoSelec) {
  for (const productoACancelar of this.ListaProductoCancelar) {
    if (detalleSeleccionado.idDetallePedido === productoACancelar.idDetallePedido) {
      
      detalleSeleccionado.estado='habilitado';
    }
  }
}
    this.ListaProductoCancelar = [];
    this.productosEnProcesoDeCancelacion.clear();

    
    console.log('Listas temporales de productos reseteadas.');
  }

  /**
   * @description Redirige a la página de modificación de un pedido.
   * @param pedido El pedido a modificar.
   */
  modificarRedireccion(pedido: any): void {
    // Implementa la lógica de redirección aquí
  }
  // Función para ordenar los productos, los cancelados van al final
  sortByEstado = (a: detallePedido, b: detallePedido) => {
    if (a.estado === 'CANCELADO' && b.estado !== 'CANCELADO') {
      return 1; // Mueve 'a' (cancelado) al final
    }
    if (a.estado !== 'CANCELADO' && b.estado === 'CANCELADO') {
      return -1; // Mantiene 'a' (no cancelado) en su lugar
    }
    return 0; // Mantiene el orden relativo si ambos son del mismo tipo
  };
}
