import { Component, OnInit } from '@angular/core';
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
export class ListSalesComponent implements OnInit {
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
  // Se mostrarán 5 botones de página a la vez
  private readonly pagesToShow = 5;

  ListaDetalleVentaSelec: detalleVentaDTO[] = [];

  // Propiedad para el modal de acciones
  ventaSeleccionada: detalleVentaDTO | null = null;

  constructor(
    private ventasS: VentasService,
    private detalleVentaS: DetalleVentasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listadoVetnas();
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

  /**
   * @description Aplica los filtros de búsqueda y estado, y ordena la lista de ventas.
   * Se llama cada vez que un filtro cambia.
   */
  applyFiltersAndSort(): void {
    let tempVentas = [...this.allVentas];

    // 1. Filtrado por texto (ID o nombre del cliente)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      tempVentas = tempVentas.filter(venta =>
        venta.cliente?.nombre.toLowerCase().includes(term) ||
        `vnt${venta.idVenta}`.toLowerCase().includes(term)
      );
    }

    // 2. Filtrado por estado
    if (this.filterStatus !== 'todos') {
      tempVentas = tempVentas.filter(venta => venta.estado === this.filterStatus);
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

  /**
   * @description Maneja el cambio del filtro de estado.
   */
  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  /**
   * @description Maneja el cambio del término de búsqueda.
   */
  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  /**
   * @description Maneja el cambio de la dirección de ordenamiento.
   */
  onSortChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  /**
   * @description Devuelve las ventas paginadas y filtradas para mostrar en la tabla.
   */
  get paginatedVentas(): ventas[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredVentas.slice(startIndex, endIndex);
  }

  /**
   * @description Carga los detalles de una venta seleccionada para el modal.
   * @param sale La venta seleccionada.
   */
  selectVentaModalDetalle(sale: ventas): void {
    this.detalleVentaS.listarPorIdVenta(sale.idVenta || 0).subscribe({
      next: (response) => {
        this.ListaDetalleVentaSelec = response.data || [];
        this.ventaSeleccionada = response.data[0];

        console.log('Detalles de la venta:', this.ListaDetalleVentaSelec);
      },
    });
  }

  /**
   * @description Confirma la cancelación/completado de una venta.
   */
  selectVentaCancelarConfirmar(): void {
    this.ventasS
      .cancelarConfirmarVenta(this.selecVetaEstado?.idVenta || 0)
      .subscribe({
        next: (response) => {
          this.closeModalById('confirmarVentaCompletadaOCanceladaModal');
          this.listadoVetnas();
        },
      });
  }

  /**
   * @description Guarda la venta seleccionada para el modal de confirmación.
   * @param sale La venta a seleccionar.
   */
  selectVenta(sale: ventas): void {
    this.selecVetaEstado = sale;
  }

  /**
   * @description Cierra un modal de Bootstrap por su ID.
   * @param modalId El ID del modal a cerrar.
   */
  closeModalById(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  // --- Lógica de Paginación Mejorada ---

  /**
   * @description Calcula el número total de páginas y genera el array de páginas visibles.
   */
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVentas.length / this.itemsPerPage);
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
}