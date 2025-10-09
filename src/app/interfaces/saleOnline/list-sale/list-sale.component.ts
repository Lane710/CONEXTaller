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

declare var bootstrap: any;

interface PedidoConDetalles {
  pedido: pedidos;
  detallePedidos: detallePedido[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-list-pedido',
  standalone: true,
  imports: [NgFor, FormsModule, NgClass, NgIf, DatePipe],
  templateUrl: './list-sale.component.html',
  styleUrl: './list-sale.component.css',
})
export class ListPedidoComponent implements OnInit, AfterViewInit {
  pedidos: pedidos[] = [];
  pedidosOriginal: pedidos[] = [];
  allPedidosConDetalles: PedidoConDetalles[] = [];
  filteredPedidosConDetalles: PedidoConDetalles[] = [];

  currentPage = 1;
  itemsPerPage = 7;
  totalPages = 0;
  pages: number[] = [];
  private readonly pagesToShow = 5; // Se mostrarán 5 botones de página a la vez

  searchText: string = '';
  filterStatus:
    | 'PENDIENTE'
    | 'CONFIRMADO'
    | 'EN_PROCESO'
    | 'ENVIADO'
    | 'ENTREGADO'
    | 'CANCELADO'
    | 'todos' = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente';

  displayedPedidos: PedidoConDetalles[] = [];

  pedidoSeleccionado: pedidos | null = null;
  ListaDetallePedidoSelec: detallePedido[] = [];
  estadoSeleccionado: string = '';
  ListaProductoCancelar: detallePedido[] = [];
  private productosEnProcesoDeCancelacion = new Set<number>();

  constructor(
    private pedidosS: PedidosService,
    private detallePedidoS: DetallePedidosService,
    private stockS: StockService
  ) {}

  ngOnInit(): void {
    this.listadoPedidos();
  }

  ngAfterViewInit(): void {
    const modalElement = document.getElementById('modalConfirmarCancelacion');
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.restablecerListasTemporales();
      });
    }
  }

  /**
   * @description Propiedad que devuelve los pedidos filtrados y paginados.
   * Se usa en el template para la lista principal.
   */
  get filteredAndPaginatedPedidos(): PedidoConDetalles[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPedidosConDetalles.slice(startIndex, endIndex);
  }

  /**
   * @description Centraliza la lógica de filtrado y ordenamiento al cambiar un filtro.
   * Restablece la paginación a la página 1.
   */
  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let tempPedidos = [...this.allPedidosConDetalles];

    if (this.searchText) {
      const term = this.searchText.toLowerCase();
      tempPedidos = tempPedidos.filter((item) => {
        const pedidoIdStr = `ped${item.pedido.idPedido}`.toLowerCase();
        if (pedidoIdStr.includes(term)) {
          return true;
        }
        const userName = item.pedido.username.toLowerCase();
        if (userName && userName.includes(term)) {
          return true;
        }
        return item.detallePedidos.some((detalle) => {
          const productName = detalle.producto?.nombre?.toLowerCase();
          return productName && productName.includes(term);
        });
      });
    }

    if (this.filterStatus !== 'todos') {
      tempPedidos = tempPedidos.filter(
        (item) => item.pedido.estado === this.filterStatus
      );
    }

    tempPedidos.sort((a, b) => {
      const dateA = new Date(a.pedido.fechaPedido || '').getTime();
      const dateB = new Date(b.pedido.fechaPedido || '').getTime();
      if (this.sortDirection === 'reciente') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    this.filteredPedidosConDetalles = tempPedidos;
    this.updatePagination();
  }

  listadoPedidos(): void {
    this.pedidosS.finAll().subscribe({
      next: (response) => {
        this.pedidosOriginal = response.data;
        this.getAllDetallesPedidos(this.pedidosOriginal);
      },
      error: (error) => {
        console.error('Error al obtener pedidos:', error);
      },
    });
  }

  getAllDetallesPedidos(pedidos: pedidos[]): void {
    const promises = pedidos.map((pedido) => {
      return lastValueFrom(this.detallePedidoS.getById(pedido.idPedido || 0))
        .then((response) => {
          return {
            pedido,
            detallePedidos: response.data,
            isExpanded: false,
          } as PedidoConDetalles;
        })
        .catch((error) => {
          console.error(
            `Error al obtener detalles del pedido ${pedido.idPedido}:`,
            error
          );
          return null;
        });
    });

    Promise.all(promises)
      .then((allDetails) => {
        this.allPedidosConDetalles = allDetails.filter(
          (item) => item !== null
        ) as PedidoConDetalles[];
        this.applyFiltersAndSort();
      })
      .catch((error) => {
        console.error(
          'Error al obtener todos los detalles de los pedidos:',
          error
        );
      });
  }

  /**
   * @description Calcula el número total de páginas y genera el array de páginas visibles.
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(
      this.filteredPedidosConDetalles.length / this.itemsPerPage
    );
    // Vuelve a la primera página si la actual no es válida después del filtrado
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.generatePaginationPages();
  }

  /**
   * @description Cambia a la página seleccionada y actualiza los botones del paginador.
   * @param page El número de la página a la que se desea ir.
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.generatePaginationPages();
    }
  }

  /**
   * @description Genera el array de números de página a mostrar en el paginador.
   */
  generatePaginationPages(): void {
    const pages = [];
    let startPage;
    let endPage;

    if (this.totalPages <= this.pagesToShow) {
      // Si el total de páginas es menor o igual al número de páginas a mostrar, muestra todas.
      startPage = 1;
      endPage = this.totalPages;
    } else {
      // Si hay más páginas que el límite, calcula el rango dinámico.
      const middle = Math.floor(this.pagesToShow / 2);
      if (this.currentPage <= middle) {
        // Al principio, muestra de 1 hasta el límite.
        startPage = 1;
        endPage = this.pagesToShow;
      } else if (this.currentPage + middle >= this.totalPages) {
        // Al final, muestra las últimas páginas.
        startPage = this.totalPages - this.pagesToShow + 1;
        endPage = this.totalPages;
      } else {
        // En el medio, el rango se centra en la página actual.
        startPage = this.currentPage - middle;
        endPage = this.currentPage + middle;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    this.pages = pages;
  }

  ordenarPorFechaReciente(): void {
    this.sortDirection = 'reciente';
    this.applyFiltersAndSort();
  }

  ordenarPorFechaAntigua(): void {
    this.sortDirection = 'antiguo';
    this.applyFiltersAndSort();
  }

  onSearch(): void {
    this.applyFiltersAndSort();
  }

  selectPedidoModalDetalle(item: PedidoConDetalles): void {
    this.pedidoSeleccionado = item.pedido;
    this.ListaDetallePedidoSelec = item.detallePedidos;
  }

  abrirModalCambiarEstado(pedido: pedidos): void {
    this.pedidoSeleccionado = pedido;
    this.estadoSeleccionado = pedido.estado || '';
    const modalElement = document.getElementById('modalCambiarEstado');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmarCambioEstado(): void {
    if (
      this.pedidoSeleccionado &&
      this.estadoSeleccionado &&
      this.pedidoSeleccionado.idPedido
    ) {
      this.pedidosS
        .actualizarEstado(
          this.pedidoSeleccionado.idPedido,
          this.estadoSeleccionado
        )
        .subscribe({
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
          },
        });
    }
  }

  abrirModalCancelarPedido(pedido: pedidos): void {
    this.pedidoSeleccionado = pedido;
    this.ListaProductoCancelar = [];
    this.productosEnProcesoDeCancelacion.clear();

    lastValueFrom(this.detallePedidoS.getById(pedido.idPedido || 0))
      .then((response) => {
        this.ListaDetallePedidoSelec = response.data;
        const modalElement = document.getElementById(
          'modalConfirmarCancelacion'
        );
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      })
      .catch((error) => {
        console.error(
          'Error al obtener los detalles del pedido para la cancelación:',
          error
        );
      });
  }

  cancelarProductoDePedido(detalle: detallePedido): void {
    if (
      detalle.idDetallePedido &&
      !this.productosEnProcesoDeCancelacion.has(detalle.idDetallePedido)
    ) {
      detalle.estado = 'CANCELADO';
      this.ListaProductoCancelar.push(detalle);
      this.productosEnProcesoDeCancelacion.add(detalle.idDetallePedido);
      console.log(
        `Producto ${detalle.producto?.nombre} añadido a la lista de cancelación.`
      );
    }
  }

  async confirmarCancelacion(): Promise<void> {
    if (!this.pedidoSeleccionado || !this.pedidoSeleccionado.idPedido) {
      console.error('No se ha seleccionado un pedido válido.');
      return;
    }

    let totalReduccion = 0;
    const productosCancelados = this.ListaProductoCancelar;
    const updateObservables: any[] = [];

    for (const detalle of productosCancelados) {
      if (detalle.producto && detalle.producto.idProducto && detalle.cantidad) {
        const stockUpdate$ = this.stockS
          .StockDelProducto(detalle.producto.idProducto)
          .pipe(
            switchMap((stockResponse) => {
              if (stockResponse?.data) {
                const stockData = stockResponse.data;
                return forkJoin([
                  this.stockS.addorRestarStockProductos(
                    stockData,
                    detalle.cantidad
                  ),
                  this.detallePedidoS.save({ ...detalle, estado: 'CANCELADO' }),
                ]);
              } else {
                console.warn(
                  `No se encontró stock para el producto con ID: ${detalle.producto?.idProducto}.`
                );
                return of(null);
              }
            })
          );
        updateObservables.push(stockUpdate$);
        totalReduccion +=
          (Number(detalle.precioUnitario) || 0) * Number(detalle.cantidad);
      }
    }

    try {
      await lastValueFrom(forkJoin(updateObservables));
      console.log('Stocks y detalles de pedido actualizados con éxito.');

      const totalActual: number = this.pedidoSeleccionado.totalPedido ?? 0;

      const nuevoTotal = totalActual - totalReduccion;

      // Se asigna el nuevo valor como string (con 2 decimales) a la propiedad.
      this.pedidoSeleccionado.totalPedido = nuevoTotal;

      const idsCancelados = new Set(
        productosCancelados.map((p) => p.idDetallePedido)
      );
      this.ListaDetallePedidoSelec = this.ListaDetallePedidoSelec.filter(
        (d) => !idsCancelados.has(d.idDetallePedido)
      );

      if (this.ListaDetallePedidoSelec.length === 0) {
        this.pedidoSeleccionado.estado = 'CANCELADO';
      }

      if (this.pedidoSeleccionado.idPedido) {
        console.log(this.pedidoSeleccionado);
        await lastValueFrom(
          this.pedidosS.update(
            this.pedidoSeleccionado.idPedido,
            this.pedidoSeleccionado
          )
        );
        console.log('Pedido principal actualizado con éxito.');
      }

      this.cerrarModalYRefrescar();
    } catch (error) {
      console.error('Error en el proceso de cancelación:', error);
    }
  }

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

  restablecerListasTemporales(): void {
    console.log(this.productosEnProcesoDeCancelacion);
    for (const detalleSeleccionado of this.ListaDetallePedidoSelec) {
      for (const productoACancelar of this.ListaProductoCancelar) {
        if (
          detalleSeleccionado.idDetallePedido ===
          productoACancelar.idDetallePedido
        ) {
          detalleSeleccionado.estado = 'CONFIRMADO';
        }
      }
    }
    this.ListaProductoCancelar = [];
    this.productosEnProcesoDeCancelacion.clear();
    console.log('Listas temporales de productos reseteadas.');
  }

  modificarRedireccion(pedido: any): void {
    // Implementa la lógica de redirección aquí
  }

  sortByEstado = (a: detallePedido, b: detallePedido) => {
    if (a.estado === 'CANCELADO' && b.estado !== 'CANCELADO') {
      return 1;
    }
    if (a.estado !== 'CANCELADO' && b.estado === 'CANCELADO') {
      return -1;
    }
    return 0;
  };
}
