import {
  Component,
  OnInit,
  AfterViewInit, // 1. Importar AfterViewInit
  ViewChild, // 2. Importar ViewChild
  ElementRef, // 3. Importar ElementRef
} from '@angular/core';
import { VentasService } from '../../../services/ventasTienda/ventas.service';
import {
  CurrencyPipe,
  DatePipe,
  NgClass,
  NgFor,
  NgIf,
  TitleCasePipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ventas } from '../../../models/Ventas/ventas';
import { DetalleVentasService } from '../../../services/ventasTienda/detalle-ventas.service';
import { detalleVentaDTO } from '../../../DTOs/VentasDTO/detalleVentaDTO';

// Import Bootstrap JS types for TypeScript recognition
declare var bootstrap: any;

@Component({
  selector: 'app-list-sales',
  standalone: true,
  imports: [
    RouterLink,
    NgFor,
    NgClass,
    NgIf,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    TitleCasePipe,
  ],
  templateUrl: './list-sales.component.html',
  styleUrl: './list-sales.component.css',
})
// 4. Implementar AfterViewInit
export class ListSalesComponent implements OnInit, AfterViewInit {
  // --- Referencias de Modales (NUEVO) ---
  @ViewChild('confirmarAccionModal') confirmarAccionModalRef!: ElementRef;
  @ViewChild('detallesVentaModal') detallesVentaModalRef!: ElementRef;

  private confirmarAccionModalInstance: any;
  private detallesVentaModalInstance: any;
isCheckingEnvio: boolean = false;
ventaEnProceso: number | null = null;
  // Propiedades para el listado de ventas y filtrado
  allVentas: ventas[] = [];
  filteredVentas: ventas[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = false;
  selecVetaEstado: ventas | null = null;
  // Propiedades para los filtros
  searchTerm: string = '';
  filterStatus: 'todos' | 'completada' | 'pendiente' | 'cancelada' = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente';

  // Propiedades para la paginación
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 0;
  pages: number[] = [];

  accionModal: 'cancelar' | 'habilitar' = 'cancelar';

  // Se mostrarán 5 botones de página a la vez
  private readonly pagesToShow = 5;

  ListaDetalleVentaSelec: any[] = [];

  // Propiedad para el modal de acciones
  ventaSeleccionada: { venta: ventas; detalles: detalleVentaDTO[] } | null =
    null;

  constructor(
    private ventasS: VentasService,
    private detalleVentaS: DetalleVentasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listadoVetnas();
  }

  // 5. Inicializar las instancias de Bootstrap
  ngAfterViewInit(): void {
    if (this.confirmarAccionModalRef) {
      this.confirmarAccionModalInstance = new bootstrap.Modal(
        this.confirmarAccionModalRef.nativeElement
      );
    }
    if (this.detallesVentaModalRef) {
      this.detallesVentaModalInstance = new bootstrap.Modal(
        this.detallesVentaModalRef.nativeElement
      );
    }
  }

  // --- Lógica de Modales (NUEVO) ---

  /**
   * @description Abre el modal de confirmación.
   */
  openConfirmarAccionModal(): void {
    if (this.confirmarAccionModalInstance) {
      this.confirmarAccionModalInstance.show();
    }
  }

  /**
   * @description Cierra el modal de confirmación.
   */
  closeConfirmarAccionModal(): void {
    if (this.confirmarAccionModalInstance) {
      this.confirmarAccionModalInstance.hide();
    }
  }

  /**
   * @description Abre el modal de detalles.
   */
  openDetallesVentaModal(): void {
    if (this.detallesVentaModalInstance) {
      this.detallesVentaModalInstance.show();
    }
  }

  /**
   * @description Cierra el modal de detalles. (No es estrictamente necesario, pero se añade por consistencia)
   */
  closeDetallesVentaModal(): void {
    if (this.detallesVentaModalInstance) {
      this.detallesVentaModalInstance.hide();
    }
  }

  // 6. MODIFICACIÓN: selectVentaModalDetalle - Llama a openDetallesVentaModal
  selectVentaModalDetalle(sale: ventas): void {
    this.detalleVentaS.listarPorIdVenta(sale.idVenta || 0).subscribe({
      next: (response) => {
        const detalles = response.data || [];

        this.ventaSeleccionada = {
          venta: sale,
          detalles: detalles,
        };
        this.ListaDetalleVentaSelec = detalles;

        // Abrir el modal después de cargar los datos
        this.openDetallesVentaModal();
      },
      error: (error) => {
        console.error('Error al cargar detalles:', error);
      },
    });
  }

  // 7. MODIFICACIÓN: selectVenta - Llama a openConfirmarAccionModal
  selectVenta(sale: ventas): void {
    this.selecVetaEstado = sale;
    this.accionModal = sale.estado === 'CANCELADA' ? 'habilitar' : 'cancelar';

    // Abrir el modal usando el nuevo método
    this.openConfirmarAccionModal();
  }

  // 8. MODIFICACIÓN: selectVentaCancelarConfirmar - Llama a closeConfirmarAccionModal
  selectVentaCancelarConfirmar(): void {
    if (!this.selecVetaEstado) {
      console.error('No hay venta seleccionada');
      return;
    }

    this.ventasS
      .cancelarConfirmarVenta(this.selecVetaEstado.idVenta!)
      .subscribe({
        next: (response) => {
          console.log(
            this.accionModal === 'cancelar'
              ? 'Venta cancelada correctamente.'
              : 'Venta habilitada correctamente.'
          );

          // Cerrar el modal usando el nuevo método
          this.closeConfirmarAccionModal();

          // SIN delay, ya que el método hide() de Bootstrap maneja el backdrop
          this.listadoVetnas();

          this.selecVetaEstado = null;
        },
        error: (err) => {
          console.error('Error al cambiar estado de venta:', err);
          this.closeConfirmarAccionModal();
        },
      });
  }

  /**
   * @description Carga la lista completa de ventas desde el servicio y aplica los filtros.
   */
  listadoVetnas(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.ventasS.findAll().subscribe({
      next: (response) => {
        this.allVentas = response.data || [];
        this.isLoading = false;
        this.applyFiltersAndSort(); // Aplica los filtros iniciales
      },
      error: (error) => {
        console.error('Error fetching sales:', error);
        this.errorMessage =
          'Ocurrió un error al cargar las ventas. Inténtalo de nuevo más tarde.';
        this.isLoading = false;
        this.allVentas = [];
        this.applyFiltersAndSort();
      },
    });
  }

  // ... (El resto de la lógica de filtrado y paginación se mantiene igual)

  applyFiltersAndSort(): void {
    let tempVentas = [...this.allVentas];

    // 1. Filtrado por texto (ID o nombre del cliente)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      tempVentas = tempVentas.filter(
        (venta) =>
          venta.cliente?.ci.toLowerCase().includes(term) ||
          `vnt${venta.idVenta}`.toLowerCase().includes(term)
      );
    }

    // 2. Filtrado por estado
    if (this.filterStatus !== 'todos') {
      // Map filterStatus to venta.estado values (uppercase)
      const statusMap: { [key: string]: string } = {
        completada: 'COMPLETADA',
        pendiente: 'PENDIENTE',
        cancelada: 'CANCELADA',
      };
      const mappedStatus = statusMap[this.filterStatus];
      tempVentas = tempVentas.filter((venta) => venta.estado === mappedStatus);
    }

    // 3. Ordenamiento por fecha
    tempVentas.sort((a, b) => {
      const dateA = new Date(a.fechaVenta || '').getTime();
      const dateB = new Date(b.fechaVenta || '').getTime();
      if (this.sortDirection === 'reciente') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    this.filteredVentas = tempVentas;
    this.calculatePagination();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  get paginatedVentas(): ventas[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredVentas.slice(startIndex, endIndex);
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVentas.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
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
    const pages = [];
    let startPage;
    let endPage;

    if (this.totalPages <= this.pagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      const middle = Math.floor(this.pagesToShow / 2);
      if (this.currentPage <= middle) {
        startPage = 1;
        endPage = this.pagesToShow;
      } else if (this.currentPage + middle >= this.totalPages) {
        startPage = this.totalPages - this.pagesToShow + 1;
        endPage = this.totalPages;
      } else {
        startPage = this.currentPage - middle;
        endPage = this.currentPage + middle;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    this.pages = pages;
  }

  /**
   * @description Se ejecuta cuando el modal se oculta (sigue siendo útil para limpieza)
   */
  onModalHidden() {
    this.selecVetaEstado = null;
    console.log('Modal cerrado completamente');
  }


// En tu list-sales.component.ts
registrarEnvio(venta: ventas) {
  console.log('Verificando envío para la venta:', venta.idVenta);
  
  this.ventasS.findVentaConEnvio(venta.idVenta!).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        // 🔥 CASO 1: La venta YA TIENE un envío registrado
        console.log('La venta ya tiene un envío registrado:', response.data);
        
        // REDIRIGIR A LA NUEVA RUTA PARA VENTAS
        this.router.navigate(['/home/envios/list-envios-venta', venta.idVenta]);
        
      } else {
        // 🔥 CASO 2: La venta NO TIENE envío registrado
        console.log('La venta no tiene envío registrado, redirigiendo a registro...');
        this.router.navigate(['/home/envios/registrarEnvio', venta.idVenta]);
      }
    },
    error: (error) => {
      console.error('Error al verificar envío de la venta:', error);
      
      if (error.status === 404) {
        // Error 404 = No se encontró envío, redirigir a registro
        this.router.navigate(['/home/envios/registrarEnvio', venta.idVenta]);
      } else {
        // Para otros errores, redirigir a la lista general de envíos
        alert('Error al verificar el estado del envío. Serás redirigido a la lista de envíos.');
        this.router.navigate(['/home/envios/list-envios']);
      }
    }
  });
}
  
}
