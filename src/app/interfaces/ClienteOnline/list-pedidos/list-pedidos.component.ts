import { Component, OnInit } from '@angular/core';
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
  cargandoDetalles?: boolean; // Para mostrar estado de carga
}

@Component({
  selector: 'app-list-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
   
    TitleCasePipe,
    LowerCasePipe,
    SlicePipe,
  ],
  templateUrl: './list-pedidos.component.html',
  styleUrls: ['./list-pedidos.component.css'],
})
export class ListPedidosComponent implements OnInit {
  pedidosOriginal: pedidos[] = [];
  allPedidosConDetalles: PedidoConDetalles[] = [];
  filteredPedidosConDetalles: PedidoConDetalles[] = [];

  //numero de pedidos
  numeroTienda: string = '59175135309';
  // Variables de paginación y filtros
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;
  pages: number[] = [];
  private readonly pagesToShow = 5;

  searchText = '';
  filterStatus: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO' | 'todos' = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente';

  // Variables para modales
  envioSeleccionado: envios | null = null;
  ListaDetallePedidoSelec: detallePedido[] = [];
  pedidoSeleccionado: pedidos | null = null;
  pedidoParaCancelar: pedidos | null = null;
  razonCancelacion: string = '';

  constructor(
    private pedidosS: PedidosService,
    private enviosS: EnviosService,
    private detallePedidoS: DetallePedidosService,
  ) {}

  ngOnInit(): void {
    this.listadoPedidos();
  }

  listadoPedidos() {
    const usernameFromLocalStorage = localStorage.getItem('current_username');

    if (usernameFromLocalStorage) {
      this.pedidosS
        .getListadoProductosPorPedidoUsuario(usernameFromLocalStorage)
        .subscribe({
          next: (response) => {
            this.pedidosOriginal = response.data || [];
            this.cargarDetallesParaPedidos(this.pedidosOriginal);
          },
          error: (error) => console.error('Error al obtener pedidos:', error),
        });
    }
  }

  // Nuevo método para cargar detalles de todos los pedidos
  cargarDetallesParaPedidos(pedidosList: pedidos[]) {
    // Inicializar array con pedidos vacíos
    this.allPedidosConDetalles = pedidosList.map((pedido) => ({
      pedido: pedido,
      detallePedidos: [],
      isExpanded: false,
      cargandoDetalles: true,
    }));

    // Cargar detalles para cada pedido
    pedidosList.forEach((pedido, index) => {
      if (pedido.idPedido) {
        this.detallePedidoS.getById(pedido.idPedido).subscribe({
          next: (response) => {
            // Actualizar los detalles del pedido correspondiente
            const pedidoIndex = this.allPedidosConDetalles.findIndex(
              (p) => p.pedido.idPedido === pedido.idPedido,
            );
            if (pedidoIndex !== -1) {
              this.allPedidosConDetalles[pedidoIndex].detallePedidos =
                response.data || [];
              this.allPedidosConDetalles[pedidoIndex].cargandoDetalles = false;
            }
            this.applyFiltersAndSort(); // Re-aplicar filtros después de cargar
          },
          error: (error) => {
            console.error(
              `Error al cargar detalles del pedido ${pedido.idPedido}:`,
              error,
            );
            const pedidoIndex = this.allPedidosConDetalles.findIndex(
              (p) => p.pedido.idPedido === pedido.idPedido,
            );
            if (pedidoIndex !== -1) {
              this.allPedidosConDetalles[pedidoIndex].cargandoDetalles = false;
            }
          },
        });
      }
    });
  }

  prepararLista(pedidosList: pedidos[]) {
    // Este método ya no se usa directamente, usamos cargarDetallesParaPedidos
    this.cargarDetallesParaPedidos(pedidosList);
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

    const statusPriority: { [key: string]: number } = {
      PENDIENTE: 1,
      ENTREGADO: 2,
      CANCELADO: 3,
    };

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      tempPedidos = tempPedidos.filter((item) => {
        // Buscar por ID del pedido
        const pedidoIdStr = `ped${item.pedido.idPedido}`.toLowerCase();

        // Buscar en nombres de productos
        const productosMatch = item.detallePedidos.some((detalle) =>
          detalle.producto.nombre.toLowerCase().includes(term),
        );

        return pedidoIdStr.includes(term) || productosMatch;
      });
    }

    if (this.filterStatus !== 'todos') {
      tempPedidos = tempPedidos.filter(
        (item) => item.pedido.estado === this.filterStatus,
      );
    }

    // 🔥 AQUÍ ESTÁ LA MAGIA: ORDENAMIENTO POR ESTADO, FECHA Y HORA 🔥
    tempPedidos.sort((a, b) => {
      const estadoA = a.pedido.estado || '';
      const estadoB = b.pedido.estado || '';

      // 1. Primero agrupa por prioridad de Estado (Pendiente > Entregado > Cancelado)
      if (statusPriority[estadoA] !== statusPriority[estadoB]) {
        return statusPriority[estadoA] - statusPriority[estadoB];
      }

      // 2. Luego ordena por Fecha + Hora exacta
      // Concatenamos la fecha y la hora (con un formato seguro: YYYY-MM-DDTHH:mm:ss)
      const fechaHoraA = `${a.pedido.fechaPedido || '1970-01-01'}T${a.pedido.horaRegistro || '00:00:00'}`;
      const fechaHoraB = `${b.pedido.fechaPedido || '1970-01-01'}T${b.pedido.horaRegistro || '00:00:00'}`;

      const dateA = new Date(fechaHoraA).getTime();
      const dateB = new Date(fechaHoraB).getTime();

      // Si sortDirection es 'reciente', el mayor (más nuevo) va primero
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
    this.totalPages = Math.ceil(
      this.filteredPedidosConDetalles.length / this.itemsPerPage,
    );
    if (this.currentPage > this.totalPages && this.totalPages > 0)
      this.currentPage = this.totalPages;
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

  // --- Modales y Acciones ---
  verEnvio(idPedido: number) {
    this.envioSeleccionado = null;
    this.enviosS.findByPedidoId(idPedido).subscribe({
      next: (response) => (this.envioSeleccionado = response.data || null),
      error: () => (this.envioSeleccionado = null),
    });
  }

  verDetalles(pedido: pedidos) {
    this.pedidoSeleccionado = pedido;
    // Buscar los detalles del pedido en allPedidosConDetalles
    const pedidoConDetalles = this.allPedidosConDetalles.find(
      (p) => p.pedido.idPedido === pedido.idPedido,
    );
    this.ListaDetallePedidoSelec = pedidoConDetalles?.detallePedidos || [];

    if (this.ListaDetallePedidoSelec.length === 0 && pedido.idPedido) {
      // Si no hay detalles, cargarlos
      this.detallePedidoS.getById(pedido.idPedido).subscribe({
        next: (response) => {
          this.ListaDetallePedidoSelec = response.data;
          // Actualizar también en allPedidosConDetalles
          const index = this.allPedidosConDetalles.findIndex(
            (p) => p.pedido.idPedido === pedido.idPedido,
          );
          if (index !== -1) {
            this.allPedidosConDetalles[index].detallePedidos = response.data;
          }
        },
        error: (error) => console.error('Error al obtener detalles:', error),
      });
    }
  }
contactarWhatsApp(item: PedidoConDetalles): void {
    const idPedido = item.pedido.codigoPedido || '#PED' + item.pedido.idPedido;
    const total = item.pedido.totalPedido;

    // Construimos la lista de productos si están disponibles en la vista
    let listaProductos = '';
    if (item.detallePedidos && item.detallePedidos.length > 0) {
      item.detallePedidos.forEach((detalle) => {
        listaProductos += `- ${detalle.cantidad}x ${detalle.producto.nombre} (Bs ${detalle.precioUnitario}) = *Bs ${detalle.subtotal}*\n`;
      });
    } else {
      listaProductos = '- (Los detalles están en el sistema)\n';
    }

    // Armamos el mensaje adaptado para una consulta de pedido existente
    const mensajeBruto = 
      `*CONSULTA DE PEDIDO WEB - ${idPedido}*\n\n` +
      `Hola, me comunico para consultar sobre el estado de mi pedido:\n\n` +
      `*Detalle de compra:*\n` +
      `${listaProductos}\n` +
      `*TOTAL: Bs ${total}*\n\n` +
      `Por favor, necesito más información. Quedo atento/a.`;

    // Codificamos y abrimos la URL en una nueva pestaña
    const mensajeCodificado = encodeURIComponent(mensajeBruto);
    const enlaceWhatsAppDefinitivo = `https://wa.me/${this.numeroTienda}?text=${mensajeCodificado}`;
    
    window.open(enlaceWhatsAppDefinitivo, '_blank');
  }
  prepararCancelacion(pedido: pedidos) {
    this.pedidoParaCancelar = pedido;
    this.razonCancelacion = '';
  }

  confirmarCancelacion() {
    if (this.pedidoParaCancelar && this.pedidoParaCancelar.idPedido) {
      
      // Si el cliente no escribió nada, enviamos un texto por defecto
      // (Opcional: Si tu backend acepta strings vacíos o nulos, puedes enviar this.razonCancelacion directamente)
      const razonFinal = this.razonCancelacion.trim() !== '' 
                          ? this.razonCancelacion.trim() 
                          : 'Cancelado por el cliente sin especificar motivo';

      this.pedidosS
        .cancelarPedidoConRazon(
          this.pedidoParaCancelar.idPedido,
          razonFinal,
        )
        .subscribe({
          next: () => {
            const modalElement = document.getElementById(
              'confirmarCancelacionModal',
            );
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            this.pedidoParaCancelar = null;
            this.razonCancelacion = '';
            this.listadoPedidos(); // Recargar la lista
          },
          error: (error) => console.error('Error al cancelar:', error),
        });
    }
  }

  trackByPedidoId(index: number, item: PedidoConDetalles): number {
    return item.pedido.idPedido || index;
  }

  trackByDetalleId(index: number, detalle: detallePedido): number {
    return detalle?.idDetallePedido || index;
  }
}
