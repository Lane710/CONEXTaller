import { Component, OnInit } from '@angular/core';
import { PedidosService } from '../../../services/PedidosEnviosDetalles/pedidos.service';
import { DatePipe, LowerCasePipe, NgClass, NgFor, NgIf, SlicePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { detallePedido } from '../../../models/PedidosEnviosDetalles/detallePedido';
import { DetallePedidosService } from '../../../services/PedidosEnviosDetalles/detalle-pedidos.service';
import { lastValueFrom } from 'rxjs';
import { PedidosDTO } from '../../../DTOs/dtosBD/PedidosDTO';

declare var bootstrap: any;

interface PedidoConDetalles {
  pedido: pedidos;
  detallePedidos: detallePedido[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-list-pedido',
  standalone: true,
  imports: [NgFor, FormsModule, NgClass, NgIf, DatePipe, TitleCasePipe, LowerCasePipe,SlicePipe],
  templateUrl: './list-sale.component.html',
  styleUrls: ['./list-sale.component.css'],
})
export class ListPedidoComponent implements OnInit {
  pedidos: pedidos[] = [];
  pedidosOriginal: pedidos[] = [];
  allPedidosConDetalles: PedidoConDetalles[] = [];
  
  // ✅ CORREGIDO: Ahora filteredPedidosConDetalles contiene TODOS los pedidos filtrados
  filteredPedidosConDetalles: PedidoConDetalles[] = [];

  currentPage = 1;
  itemsPerPage = 7;
  totalPages = 0;
  pages: number[] = [];
  private readonly pagesToShow = 5;

  searchText = '';
  filterStatus: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO' | 'todos' = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente'; // ✅ Por defecto del más reciente al más antiguo

  pedidoSeleccionado: PedidoConDetalles | null = null;
  pedidoParaCancelar: pedidos | null = null;
  estadoSeleccionado = '';

  constructor(
    private pedidosS: PedidosService,
    private detallePedidoS: DetallePedidosService
  ) {}

  ngOnInit(): void {
    this.listadoPedidos();
  }

  // ✅ CORREGIDO: Ahora filteredAndPaginatedPedidos solo maneja la paginación
  get filteredAndPaginatedPedidos(): PedidoConDetalles[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPedidosConDetalles.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1; // Resetear a primera página al cambiar filtros
    this.applyFiltersAndSort();
  }

  // ✅ CORREGIDO: Los filtros ahora se aplican a TODA la lista
  applyFiltersAndSort(): void {
    let tempPedidos = [...this.allPedidosConDetalles];

    // 🔍 Filtrado por texto - aplica a TODA la lista
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      tempPedidos = tempPedidos.filter((item) => {
        // Buscar por ID de pedido
        const pedidoIdStr = `ped${item.pedido.idPedido}`.toLowerCase();
        if (pedidoIdStr.includes(term)) return true;

        // Buscar por nombre de usuario
        const userName = item.pedido.usuario?.username?.toLowerCase() || '';
        if (userName.includes(term)) return true;

        // Buscar por nombre de producto en los detalles
        return item.detallePedidos.some((detalle) =>
          detalle.producto?.nombre?.toLowerCase().includes(term)
        );
      });
    }

    // 📦 Filtrado por estado - aplica a TODA la lista
    if (this.filterStatus !== 'todos') {
      tempPedidos = tempPedidos.filter(
        (item) => item.pedido.estado === this.filterStatus
      );
    }

    // 🕒 Ordenar por fecha - aplica a TODA la lista
    tempPedidos.sort((a, b) => {
      const dateA = new Date(a.pedido.fechaPedido || '').getTime();
      const dateB = new Date(b.pedido.fechaPedido || '').getTime();
      
      // ✅ Por defecto: del más reciente al más antiguo
      return this.sortDirection === 'reciente' ? dateB - dateA : dateA - dateB;
    });

    // ✅ CORREGIDO: Ahora filteredPedidosConDetalles contiene TODOS los resultados filtrados
    this.filteredPedidosConDetalles = tempPedidos;
    this.updatePagination();
  }

  onSearch(): void {
    this.currentPage = 1; // Resetear a primera página al buscar
    this.applyFiltersAndSort();
  }

  listadoPedidos(): void {
    this.pedidosS.finAll().subscribe({
      next: (response) => {
        console.log(response)
        this.pedidosOriginal = response.data;
        this.getAllDetallesPedidos(this.pedidosOriginal);
      },
      error: (error) => console.error('Error al obtener pedidos:', error),
    });
  }

  getAllDetallesPedidos(pedidos: pedidos[]): void {
    const promises = pedidos.map((pedido) =>
      lastValueFrom(this.detallePedidoS.getById(pedido.idPedido || 0))
        .then((response) => ({
          pedido,
          detallePedidos: (response.data || []).filter((detalle: null) => detalle !== null),
          isExpanded: false,
        }))
        .catch((error) => {
          console.error(
            `Error al obtener detalles del pedido ${pedido.idPedido}:`,
            error
          );
          return null;
        })
    );

    Promise.all(promises)
      .then((allDetails) => {
        // Filtrar items nulos y detalles nulos
        this.allPedidosConDetalles = (allDetails.filter(
          (item) => item !== null && item.detallePedidos !== undefined
        ) as unknown) as PedidoConDetalles[];
        
        // ✅ CORREGIDO: Aplicar filtros y ordenación inicial
        this.applyFiltersAndSort();
      })
      .catch((error) =>
        console.error('Error al obtener todos los detalles:', error)
      );
  }

  // ✅ CORREGIDO: La paginación ahora se calcula sobre TODOS los resultados filtrados
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPedidosConDetalles.length / this.itemsPerPage);
    
    // Asegurarse de que currentPage no exceda el total de páginas
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }
    
    this.generatePaginationPages();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.generatePaginationPages();
    }
  }

  generatePaginationPages(): void {
    const pages: number[] = [];
    let startPage, endPage;
    const middle = Math.floor(this.pagesToShow / 2);

    if (this.totalPages <= this.pagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else if (this.currentPage <= middle) {
      startPage = 1;
      endPage = this.pagesToShow;
    } else if (this.currentPage + middle >= this.totalPages) {
      startPage = this.totalPages - this.pagesToShow + 1;
      endPage = this.totalPages;
    } else {
      startPage = this.currentPage - middle;
      endPage = this.currentPage + middle;
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    this.pages = pages;
  }

  ordenarPorFechaReciente(): void {
    this.sortDirection = 'reciente';
    this.currentPage = 1; // Resetear a primera página al ordenar
    this.applyFiltersAndSort();
  }

  ordenarPorFechaAntigua(): void {
    this.sortDirection = 'antiguo';
    this.currentPage = 1; // Resetear a primera página al ordenar
    this.applyFiltersAndSort();
  }

  selectPedidoModalDetalle(item: PedidoConDetalles): void {
    console.log('eiprugheipurghepiourg',item)
    this.pedidoSeleccionado = item;
  }

  abrirModalCambiarEstado(pedido: PedidoConDetalles): void {
    this.pedidoSeleccionado = pedido;
    this.estadoSeleccionado = pedido.pedido.estado || '';
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
      this.pedidoSeleccionado.pedido.idPedido
    ) {
      this.pedidosS
        .actualizarEstado(this.pedidoSeleccionado.pedido.idPedido, this.estadoSeleccionado)
        .subscribe({
          next: () => {
            this.cerrarModal('modalCambiarEstado');
            this.listadoPedidos(); // Recargar datos
          },
          error: (error) => console.error('Error al actualizar el estado:', error),
        });
    }
  }

  abrirModalCancelarPedido(pedido: pedidos): void {
    this.pedidoParaCancelar = pedido;
    const modalElement = document.getElementById('modalConfirmarCancelacion');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmarCancelacion(): void {
    if (this.pedidoParaCancelar && this.pedidoParaCancelar.idPedido) {
      this.pedidosS.actualizarEstado(this.pedidoParaCancelar.idPedido, 'CANCELADO').subscribe({
        next: () => {
          this.cerrarModal('modalConfirmarCancelacion');
          this.listadoPedidos(); // Recargar datos
          this.pedidoParaCancelar = null;
        },
        error: (error) => {
          console.error('Error al cancelar el pedido:', error);
          this.cerrarModal('modalConfirmarCancelacion');
        },
      });
    }
  }

  cerrarModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
  }

  sortByEstado = (a: detallePedido, b: detallePedido) => {
    if (a.estado === 'CANCELADO' && b.estado !== 'CANCELADO') return 1;
    if (a.estado !== 'CANCELADO' && b.estado === 'CANCELADO') return -1;
    return 0;
  };

  trackByDetalleId(index: number, detalle: detallePedido): number {
    return detalle?.idDetallePedido || index;
  }

  // Agrega este método a tu componente TypeScript
DetalleEnvio(): void {
 // window.print();
}
}