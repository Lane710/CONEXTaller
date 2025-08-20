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
import { Router, RouterLink } from '@angular/router';
import { ventas } from '../../../models/Ventas/ventas';
import { DetalleVentasService } from '../../../services/ventasTienda/detalle-ventas.service';
import { detalleVentaDTO } from '../../../DTOs/VentasDTO/detalleVentaDTO';
import { DataSharingService } from '../../../services/data-sharing.service';

// Import Bootstrap JS types for TypeScript recognition
declare var bootstrap: any;

@Component({
  selector: 'app-list-sales',
  standalone: true, // Asegúrate de que sea `standalone` si no es parte de un módulo.
  imports: [
    RouterLink,
    NgFor,
    NgClass,
    CurrencyPipe,
    NgIf,
    DatePipe,
    TitleCasePipe,
  ],
  templateUrl: './list-sales.component.html',
  styleUrl: './list-sales.component.css',
})
export class ListSalesComponent implements OnInit {
  // Propiedades para el listado de ventas
  listaVentas: ventas[] = [];
  paginatedVentas: ventas[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = false;
  selecVetaEstado: ventas | null = null;
  // Propiedades para la paginación
  currentPage: number = 1;
  itemsPerPage: number = 7; // Cantidad de elementos por página
  totalPages: number = 0;
  pages: number[] = [];
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
   * Carga la lista completa de ventas desde el servicio y calcula la paginación.
   */
  listadoVetnas(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.ventasS.findAll().subscribe({
      next: (response) => {
        this.listaVentas = response.data || [];
        this.isLoading = false;
        this.calculatePagination();
      },
      error: (error) => {
        console.error('Error fetching sales:', error);
        this.errorMessage =
          'Ocurrió un error al cargar las ventas. Inténtalo de nuevo más tarde.';
        this.isLoading = false;
        this.listaVentas = [];
        this.calculatePagination();
      },
    });
  }

  /**
   * Guarda la venta seleccionada para mostrarla en un modal.
   * @param sale La venta seleccionada.
   */
  selectVentaModalDetalle(sale: ventas): void {
    this.detalleVentaS.listarPorIdVenta(sale.idVenta || 0).subscribe({
      next: (response) => {
        this.ListaDetalleVentaSelec = response.data || [];
        this.ventaSeleccionada = response.data[0];
        console.log('Detalles de la venta:', this.ListaDetalleVentaSelec);
        console.log('Detalles de la venta:', response.data);
      },
    });
  }
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
  selectVenta(sale: ventas): void {
    this.selecVetaEstado = sale;
  }

  modificarRedireccion(sale: ventas): void {
    console.log('Redirigiendo a modificar venta con ID:', sale.idVenta);
    this.router.navigate(['/home/modificarVenta', sale.idVenta]);

  }
  //TODOO LO RELACIONADO A LA PAGINACION

  /**
   * Calcula el número total de páginas y genera el array de páginas.
   */
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.listaVentas.length / this.itemsPerPage);
    // Genera un array [1, 2, 3, ...] para usar en el *ngFor de la paginación
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.paginateItems();
  }

  /**
   * Actualiza la lista de ventas que se mostrará en la página actual.
   */
  paginateItems(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedVentas = this.listaVentas.slice(startIndex, endIndex);
  }

  /**
   * Cambia a la página seleccionada.
   * @param page El número de la página a la que se desea ir.
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateItems();
    }
  }
  //cerrar los modales
  closeModalById(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }
}
