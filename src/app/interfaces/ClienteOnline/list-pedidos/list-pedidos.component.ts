import { Component, OnInit, Renderer2 } from '@angular/core';
import {
  CommonModule,
  DatePipe,
  LowerCasePipe,
  TitleCasePipe,
  SlicePipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosService } from '../../../services/PedidosEnviosDetalles/pedidos.service';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
import { detallePedido } from '../../../models/PedidosEnviosDetalles/detallePedido';
import { DetallePedidosService } from '../../../services/PedidosEnviosDetalles/detalle-pedidos.service';

declare var bootstrap: any;

interface PedidoConDetalles {
  pedido: pedidos;
  detallePedidos: detallePedido[];
  isExpanded?: boolean;
  cargandoDetalles?: boolean;
}

@Component({
  selector: 'app-list-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, LowerCasePipe, SlicePipe],
  templateUrl: './list-pedidos.component.html',
  styleUrls: ['./list-pedidos.component.css'],
})
export class ListPedidosComponent implements OnInit {
  pedidosOriginal: pedidos[] = [];
  allPedidosConDetalles: PedidoConDetalles[] = [];
  filteredPedidosConDetalles: PedidoConDetalles[] = [];

  numeroTienda: string = '59175135309';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;
  pages: number[] = [];
  private readonly pagesToShow = 5;

  searchText = '';
  filterStatus: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO' | 'todos' = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente';

  // Variables Modales
  envioSeleccionado: envios | null = null;
  ListaDetallePedidoSelec: detallePedido[] = [];
  pedidoSeleccionado: pedidos | null = null;
  pedidoParaCancelar: pedidos | null = null;
  razonCancelacion: string = '';

  constructor(
    private pedidosS: PedidosService,
    private enviosS: EnviosService,
    private detallePedidoS: DetallePedidosService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.listadoPedidos();
  }

  listadoPedidos() {
    const usernameFromLocalStorage = localStorage.getItem('current_username');
    if (usernameFromLocalStorage) {
      this.pedidosS.getListadoProductosPorPedidoUsuario(usernameFromLocalStorage).subscribe({
        next: (response) => {
          this.pedidosOriginal = response.data || [];
          this.cargarDetallesParaPedidos(this.pedidosOriginal);
        },
        error: (error) => console.error('Error al obtener pedidos:', error),
      });
    }
  }

  cargarDetallesParaPedidos(pedidosList: pedidos[]) {
    this.allPedidosConDetalles = pedidosList.map((pedido) => ({
      pedido: pedido,
      detallePedidos: [],
      isExpanded: false,
      cargandoDetalles: true,
    }));

    pedidosList.forEach((pedido) => {
      if (pedido.idPedido) {
        this.detallePedidoS.getById(pedido.idPedido).subscribe({
          next: (response) => {
            const pedidoIndex = this.allPedidosConDetalles.findIndex((p) => p.pedido.idPedido === pedido.idPedido);
            if (pedidoIndex !== -1) {
              this.allPedidosConDetalles[pedidoIndex].detallePedidos = response.data || [];
              this.allPedidosConDetalles[pedidoIndex].cargandoDetalles = false;
            }
            this.applyFiltersAndSort();
          },
          error: (error) => {
            console.error(`Error al cargar detalles del pedido ${pedido.idPedido}:`, error);
            const pedidoIndex = this.allPedidosConDetalles.findIndex((p) => p.pedido.idPedido === pedido.idPedido);
            if (pedidoIndex !== -1) {
              this.allPedidosConDetalles[pedidoIndex].cargandoDetalles = false;
            }
          },
        });
      }
    });
  }

  // --- Filtros y Paginación ---
  get filteredAndPaginatedPedidos(): PedidoConDetalles[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPedidosConDetalles.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

 applyFiltersAndSort(): void {
    let tempPedidos = [...this.allPedidosConDetalles];

    // 1. Aplicar filtro de búsqueda por texto (ID o Producto)
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      tempPedidos = tempPedidos.filter((item) => {
        const pedidoIdStr = `ped${item.pedido.idPedido}`.toLowerCase();
        const productosMatch = item.detallePedidos.some((detalle) =>
          detalle.producto.nombre.toLowerCase().includes(term)
        );
        return pedidoIdStr.includes(term) || productosMatch;
      });
    }

    // 2. Aplicar filtro por estado (si no es 'todos')
    if (this.filterStatus !== 'todos') {
      tempPedidos = tempPedidos.filter((item) => item.pedido.estado === this.filterStatus);
    }

    // 3. Ordenar ESTRICTAMENTE por Fecha y Hora
    tempPedidos.sort((a, b) => {
      // Concatenamos fecha y hora para tener un valor exacto
      const fechaHoraA = `${a.pedido.fechaPedido || '1970-01-01'}T${a.pedido.horaRegistro || '00:00:00'}`;
      const fechaHoraB = `${b.pedido.fechaPedido || '1970-01-01'}T${b.pedido.horaRegistro || '00:00:00'}`;

      const dateA = new Date(fechaHoraA).getTime();
      const dateB = new Date(fechaHoraB).getTime();

      // Dependiendo de sortDirection, ordenamos de más reciente a más antiguo o viceversa
      return this.sortDirection === 'reciente' ? dateB - dateA : dateA - dateB;
    });

    this.filteredPedidosConDetalles = tempPedidos;
    this.updatePagination();
  }
  ordenarPorFechaReciente(): void {
    this.sortDirection = 'reciente';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  ordenarPorFechaAntigua(): void {
    this.sortDirection = 'antiguo';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPedidosConDetalles.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = this.totalPages;
    else if (this.totalPages === 0) this.currentPage = 1;
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

  // ==========================================
  // MANEJO DE MODALES LIMPIO
  // ==========================================
  
  private abrirModal(modalId: string) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      let modal = bootstrap.Modal.getInstance(modalEl);
      if (!modal) {
        modal = new bootstrap.Modal(modalEl);
      }
      modal.show();
    }
  }

  private cerrarModal(modalId: string) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
  }

  limpiarEstadoModales() {
    this.renderer.removeClass(document.body, 'modal-open');
    this.renderer.setStyle(document.body, 'overflow', '');
    this.renderer.setStyle(document.body, 'padding-right', '');
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
    }
  }

  // --- Acciones ---
  verDetalles(pedido: pedidos) {
    this.pedidoSeleccionado = pedido;
    const pedidoConDetalles = this.allPedidosConDetalles.find((p) => p.pedido.idPedido === pedido.idPedido);
    this.ListaDetallePedidoSelec = pedidoConDetalles?.detallePedidos || [];

    if (this.ListaDetallePedidoSelec.length === 0 && pedido.idPedido) {
      this.detallePedidoS.getById(pedido.idPedido).subscribe({
        next: (response) => {
          this.ListaDetallePedidoSelec = response.data;
          const index = this.allPedidosConDetalles.findIndex((p) => p.pedido.idPedido === pedido.idPedido);
          if (index !== -1) {
            this.allPedidosConDetalles[index].detallePedidos = response.data;
          }
          this.abrirModal('detallePedidoModal');
        },
        error: (error) => console.error('Error al obtener detalles:', error),
      });
    } else {
      this.abrirModal('detallePedidoModal');
    }
  }

  verEnvio(idPedido: number) {
    // Cierra el modal de detalle primero
    this.cerrarModal('detallePedidoModal');
    this.envioSeleccionado = null;

    this.enviosS.findByPedidoId(idPedido).subscribe({
      next: (response) => {
        this.envioSeleccionado = response.data || null;
        // Esperamos a que cierre el anterior (aprox 400ms) antes de abrir el nuevo
        setTimeout(() => this.abrirModal('detalleEnvioModal'), 400);
      },
      error: () => {
        this.envioSeleccionado = null;
        setTimeout(() => this.abrirModal('detalleEnvioModal'), 400);
      },
    });
  }

  prepararCancelacion(pedido: pedidos) {
    this.pedidoParaCancelar = pedido;
    this.razonCancelacion = '';
    this.abrirModal('confirmarCancelacionModal');
  }

  confirmarCancelacion() {
    if (this.pedidoParaCancelar && this.pedidoParaCancelar.idPedido) {
      const razonFinal = this.razonCancelacion.trim() !== '' 
                          ? this.razonCancelacion.trim() 
                          : 'Cancelado por el cliente sin especificar motivo';

      this.pedidosS.cancelarPedidoConRazon(this.pedidoParaCancelar.idPedido, razonFinal).subscribe({
        next: () => {
          this.cerrarModal('confirmarCancelacionModal');
          
          // Limpieza forzosa porque recargamos la lista
          setTimeout(() => {
            this.limpiarEstadoModales();
            this.pedidoParaCancelar = null;
            this.razonCancelacion = '';
            this.listadoPedidos();
          }, 300);
        },
        error: (error) => {
          console.error('Error al cancelar:', error);
          this.cerrarModal('confirmarCancelacionModal');
          setTimeout(() => this.limpiarEstadoModales(), 300);
        },
      });
    }
  }

  contactarWhatsApp(item: PedidoConDetalles): void {
    const idPedido = item.pedido.codigoPedido || '#PED' + item.pedido.idPedido;
    const total = item.pedido.totalPedido;

    let listaProductos = '';
    if (item.detallePedidos && item.detallePedidos.length > 0) {
      item.detallePedidos.forEach((detalle) => {
        listaProductos += `- ${detalle.cantidad}x ${detalle.producto.nombre} (Bs ${detalle.precioUnitario}) = *Bs ${detalle.subtotal}*\n`;
      });
    } else {
      listaProductos = '- (Los detalles están en el sistema)\n';
    }

    const mensajeBruto = 
      `*CONSULTA DE PEDIDO WEB - ${idPedido}*\n\n` +
      `Hola, me comunico para consultar sobre el estado de mi pedido:\n\n` +
      `*Detalle de compra:*\n` +
      `${listaProductos}\n` +
      `*TOTAL: Bs ${total}*\n\n` +
      `Por favor, necesito más información. Quedo atento/a.`;

    const mensajeCodificado = encodeURIComponent(mensajeBruto);
    const enlaceWhatsAppDefinitivo = `https://wa.me/${this.numeroTienda}?text=${mensajeCodificado}`;
    
    window.open(enlaceWhatsAppDefinitivo, '_blank');
  }

  trackByPedidoId(index: number, item: PedidoConDetalles): number {
    return item.pedido.idPedido || index;
  }

  trackByDetalleId(index: number, detalle: detallePedido): number {
    return detalle?.idDetallePedido || index;
  }
}