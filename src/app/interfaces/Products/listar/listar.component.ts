// src/app/interfaces/Products/listar/listar.component.ts

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { stock } from '../../../models/ProductoStockModel/stock';

import { StockService } from '../../../services/ProductosServis/stock.service';
import { ProductosService } from '../../../services/ProductosServis/productos.service';
import { ApiResponse } from '../../../models/api-response';
import { categorias } from '../../../models/ProductoStockModel/categorias';

declare var bootstrap: any;

@Component({
  selector: 'app-listar-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, RouterLink, NgClass],
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.css'],
})
export class ListarComponent implements OnInit, AfterViewInit {
  // --- Listas de Datos ---
  stocks: stock[] = []; // Lista maestra, ordenada
  filteredStocks: stock[] = []; // Lista filtrada
  paginatedStocks: stock[] = []; // Lista para mostrar en la página actual
  categorias: categorias[] = [];
  
  stockSeleccionado: stock | null = null;
  
  // --- Estados de Carga y Error ---
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // --- Estados de Modales ---
  showModal: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];
  isSuccessModal: boolean = false;

  // --- Modal de Modificar Stock ---
  modStockValue: stock | null = null;
  cantidadStock: number = 1;
  private isStockModalClosing: boolean = false;

  // --- Referencias a Modales de Bootstrap ---
  @ViewChild('confirmarAccionModalRef') confirmarAccionModalRef!: ElementRef;
  private confirmarAccionModal: any;

  @ViewChild('modalDetallesProductoRef') modalDetallesProductoRef!: ElementRef;
  private modalDetallesProducto: any;

  @ViewChild('stockModal') stockModalRef!: ElementRef;
  private stockModalInstance: any;

  // --- PROPIEDADES DE PAGINACIÓN ---
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0; // Ahora es una propiedad
  pagesToShow = 5;

  // --- PROPIEDADES DE FILTRO ---
  searchText: string = '';
  filterBy: string = 'nombre';
  filterStatus: 'todos' | 'activo' | 'inactivo' = 'todos';
  filterCategory: string = 'todos';

  constructor(
    private stockService: StockService,
    private productosService: ProductosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getStocks();
    this.loadCategorias();
  }

  ngAfterViewInit(): void {
    if (this.confirmarAccionModalRef) {
      this.confirmarAccionModal = new bootstrap.Modal(
        this.confirmarAccionModalRef.nativeElement
      );
    }

    if (this.modalDetallesProductoRef) {
      this.modalDetallesProducto = new bootstrap.Modal(
        this.modalDetallesProductoRef.nativeElement
      );
    }

    if (this.stockModalRef) {
      this.stockModalInstance = new bootstrap.Modal(
        this.stockModalRef.nativeElement
      );
      this.stockModalRef.nativeElement.addEventListener(
        'hidden.bs.modal',
        () => {
          this.limpiarModalStock();
        }
      );
    }
  }

  getStocks(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.stockService.findAll().subscribe({
      next: (response: ApiResponse) => {
        if (response && response.data) {
          
          const stockData = response.data as stock[];

          // 1. Ordenar la lista (del más nuevo al más viejo)
          stockData.sort((a, b) => {
            const dateA = a.producto?.fechaRegistro
              ? new Date(a.producto.fechaRegistro).getTime()
              : 0;
            const dateB = b.producto?.fechaRegistro
              ? new Date(b.producto.fechaRegistro).getTime()
              : 0;
            return dateB - dateA; // Descendente
          });

          this.stocks = stockData;
          
          // 2. Aplicar filtros y paginación inicial
          this.applyFilters();
          
          this.isLoading = false;
        } else {
          this.errorMessage =
            response.message || 'No se encontraron registros de stock.';
          this.stocks = [];
          this.filteredStocks = [];
          this.paginatedStocks = [];
          this.isLoading = false;
          this.showModalMessage('Información', this.errorMessage, false);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          'Error al cargar el stock: ' + (err.message || 'Error desconocido');
        this.isLoading = false;
        this.showModalMessage('Error', this.errorMessage, false);
      },
    });
  }

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN REFACTORIZADA ---

  /**
   * Se ejecuta CADA VEZ que cambia un filtro o la búsqueda.
   * Filtra la lista maestra, resetea la página a 1 y actualiza la vista.
   */
  applyFilters(): void {
    // 1. Filtrar la lista maestra (this.stocks)
    this.filteredStocks = this.stocks.filter((item) => {
      let matchesSearch = true;
      if (this.searchText) {
        const term = this.searchText.toLowerCase();
        switch (this.filterBy) {
          case 'nombre':
            matchesSearch = item.producto?.nombre?.toLowerCase().includes(term) || false;
            break;
          case 'marca':
            matchesSearch = item.producto?.marca?.toLowerCase().includes(term) ?? false;
            break;
          case 'sku':
            matchesSearch = item.producto?.sku?.toLowerCase().includes(term) ?? false;
            break;
        }
      }

      const matchesStatus =
        this.filterStatus === 'todos' ||
        (this.filterStatus === 'activo' && item.producto?.estado === 1) ||
        (this.filterStatus === 'inactivo' && item.producto?.estado === 0);

      const matchesCategory =
        this.filterCategory === 'todos' ||
        (item.producto?.subcategoria?.categoria?.nombre === this.filterCategory);

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // 2. Calcular el total de páginas
    this.totalPages = Math.ceil(this.filteredStocks.length / this.itemsPerPage);

    // 3. Resetear a la página 1
    this.currentPage = 1;

    // 4. Actualizar la lista paginada
    this.updatePaginatedList();
  }

  /**
   * "Corta" la lista filtrada (filteredStocks) para obtener
   * solo los items de la página actual.
   */
  updatePaginatedList(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedStocks = this.filteredStocks.slice(startIndex, endIndex);
    
  }

  /**
   * Se ejecuta al cambiar el texto de búsqueda o el tipo de filtro.
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Se ejecuta al escribir en la barra de búsqueda.
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Se ejecuta al hacer clic en un número de página.
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Solo actualiza la paginación, NO vuelve a filtrar
      this.updatePaginatedList();
    }
  }

  /**
   * Genera los números de página para mostrar en la paginación.
   */
  getPagesArray(): number[] {
    const pages = [];
    let startPage;
    let endPage;

    if (this.totalPages <= this.pagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      const half = Math.floor(this.pagesToShow / 2);
      if (this.currentPage <= half) {
        startPage = 1;
        endPage = this.pagesToShow;
      } else if (this.currentPage + half >= this.totalPages) {
        startPage = this.totalPages - this.pagesToShow + 1;
        endPage = this.totalPages;
      } else {
        startPage = this.currentPage - half;
        endPage = this.currentPage + half;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  // --- FIN DE LA LÓGICA DE FILTRADO ---


  isModalDetallesProductoShown(): boolean {
    return this.modalDetallesProducto && this.modalDetallesProducto._isShown;
  }

  loadCategorias(): void {
    this.productosService.getCategorias().subscribe({
      next: (response: ApiResponse) => {
        if (response.success && response.data) {
          this.categorias = response.data as categorias[];
        } else {
          this.showModalMessage(
            'Error',
            'No se pudieron cargar las categorías: ' + response.message,
            false
          );
        }
      },
      error: (err: HttpErrorResponse) => {
        this.showModalMessage(
          'Error',
          'Error de conexión al cargar categorías: ' +
            (err.message || 'Error desconocido'),
          false
        );
      },
    });
  }

  getCategoryName(idCategoria: number | undefined): string {
    //
    if (idCategoria === undefined || idCategoria === null) {
      return 'N/A';
    }
    const categoriaEncontrada = this.categorias.find(
      (cat) => cat.idCategoria === idCategoria
    );
    return categoriaEncontrada ? categoriaEncontrada.nombre : 'Desconocida';
  }

  verDetallesStock(stockItem: stock): void {
    this.stockSeleccionado = stockItem;
    console.log(this.stockSeleccionado)
    this.modalDetallesProducto?.show();
  }

  abrirModalConfirmacion(stockItem: stock): void {
    
    this.stockSeleccionado = stockItem;
    this.confirmarAccionModal?.show();
  }

  confirmarAccionProducto(): void {
    if (
      this.stockSeleccionado &&
      this.stockSeleccionado.producto?.idProducto !== undefined &&
      this.stockSeleccionado.producto.idProducto !== null
    ) {
      const idProducto = this.stockSeleccionado.producto.idProducto;
      this.productosService.toggleProductStatus(idProducto).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.showModalMessage(
              'Éxito',
              response.message || 'Estado del producto cambiado con éxito.',
              true
            );
            this.confirmarAccionModal?.hide();
            // Recargamos los datos para reflejar el cambio
            this.getStocks();
          } else {
            this.showModalMessage(
              'Error',
              response.message || 'Error al cambiar el estado del producto.',
              false
            );
          }
        },
        error: (err: HttpErrorResponse) => {
          this.showModalMessage(
            'Error',
            'Error de conexión al cambiar el estado del producto: ' +
              (err.message || 'Error desconocido'),
            false
          );
        },
      });
    } else {
      this.showModalMessage(
        'Error',
        'Registro de stock no seleccionado o ID de producto no válido.',
        false
      );
    }
  }

  showModalMessage(title: string, message: string, isSuccess: boolean): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isSuccessModal = isSuccess;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalDetails = [];
  }

  closeDetallesModal(): void {
    this.modalDetallesProducto?.hide();
    this.stockSeleccionado = null;
  }

  // Método para abrir el modal de stock
  abrirModalStock(stock: stock): void {
    this.modStockValue = stock;
    this.cantidadStock = stock.cantidad;
    
    

    setTimeout(() => {
      if (this.stockModalInstance) {
        this.stockModalInstance.show();
      }
    }, 0);
  }

  // Método para cerrar el modal de stock
  cerrarModalStock(): void {
    if (this.isStockModalClosing) return;
    this.isStockModalClosing = true;

    if (this.stockModalInstance) {
      this.stockModalInstance.hide();
    }
    
    setTimeout(() => {
      this.isStockModalClosing = false;
    }, 300);
  }

  // Limpiar estado del modal de stock
  private limpiarModalStock(): void {
    this.modStockValue = null;
    this.cantidadStock = 1;
  }

  // Método principal para modificar stock
  ModificarStock(): void {
    if (!this.modStockValue || this.modStockValue.idStock === undefined) {
      this.showModalMessage(
        'Error',
        'No se ha seleccionado un stock válido.',
        false
      );
      return;
    }

    if (this.cantidadStock < 0 || this.cantidadStock > 150) {
      this.showModalMessage(
        'Error',
        'La cantidad debe estar entre 0 y 150.',
        false
      );
      return;
    }

    const updatedStock: stock = {
      ...this.modStockValue,
      cantidad: this.cantidadStock,
    };

    this.stockService
      .updateStock(updatedStock, this.modStockValue.idStock)
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.cerrarModalStock();
            this.showModalMessage(
              'Éxito',
              response.message || 'Stock modificado con éxito.',
              true
            );
            // Recargamos los datos para reflejar el cambio
            this.getStocks();
          } else {
            this.showModalMessage(
              'Error',
              response.message || 'Error al modificar el stock.',
              false
            );
          }
        },
        error: (err) => {
          console.error('Error al modificar stock:', err);
          this.showModalMessage(
            'Error',
            'No se pudo modificar el stock. Por favor, intente nuevamente.',
            false
          );
        },
      });
  }

  // Método alternativo para cargar stock (mantener por compatibilidad)
  cargarStock(stock: stock): void {
    this.abrirModalStock(stock);
  }
}