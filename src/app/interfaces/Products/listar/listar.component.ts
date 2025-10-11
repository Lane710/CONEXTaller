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
  stocks: stock[] = [];
  stockSeleccionado: stock | null = null;
  categorias: categorias[] = [];

  isLoading: boolean = true;
  errorMessage: string | null = null;

  showModal: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];
  isSuccessModal: boolean = false;

  //variable modificar stock
  modStockValue: stock | null = null;
  cantidadStock: number = 1;
  private isStockModalClosing: boolean = false;

  @ViewChild('confirmarAccionModalRef') confirmarAccionModalRef!: ElementRef;
  private confirmarAccionModal: any;

  @ViewChild('modalDetallesProductoRef') modalDetallesProductoRef!: ElementRef;
  private modalDetallesProducto: any;

  @ViewChild('stockModal') stockModalRef!: ElementRef;
  private stockModalInstance: any;

  // --- PROPIEDADES DE PAGINACIÓN ---
  currentPage: number = 1;
  itemsPerPage: number = 7;
  pagesToShow = 5; // Número de botones de página a mostrar
  
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

    // Inicializar el modal de stock
    if (this.stockModalRef) {
      this.stockModalInstance = new bootstrap.Modal(this.stockModalRef.nativeElement);
      
      // Escuchar evento cuando el modal se cierra completamente
      this.stockModalRef.nativeElement.addEventListener('hidden.bs.modal', () => {
        this.limpiarModalStock();
      });
    }
  }

  getStocks(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.stockService.findAll().subscribe({
      next: (response: ApiResponse) => {
        console.log('Respuesta del servicio de stock:', response);
        if (response && response.data) {
          this.stocks = response.data as stock[];
          this.isLoading = false;
        } else {
          this.errorMessage =
            response.message || 'No se encontraron registros de stock.';
          this.stocks = [];
          this.isLoading = false;
          this.showModalMessage('Información', this.errorMessage, false);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          'Error al cargar el stock: ' + (err.message || 'Error desconocido');
        this.isLoading = false;
        console.error('Error al obtener el stock:', err);
        this.showModalMessage('Error', this.errorMessage, false);
      },
    });
  }

  get filteredAndPaginatedStocks(): stock[] {
    let filteredList = this.stocks.filter((item) => {
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

      const matchesStatus = this.filterStatus === 'todos' ||
                            (this.filterStatus === 'activo' && item.producto?.estado === 1) ||
                            (this.filterStatus === 'inactivo' && item.producto?.estado === 0);
      
      const matchesCategory = this.filterCategory === 'todos' ||
                              (item.producto?.categoria?.nombre === this.filterCategory);

      return matchesSearch && matchesStatus && matchesCategory;
    });

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filteredList.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    let filteredCount = this.stocks.filter((item) => {
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

      const matchesStatus = this.filterStatus === 'todos' ||
                            (this.filterStatus === 'activo' && item.producto?.estado === 1) ||
                            (this.filterStatus === 'inactivo' && item.producto?.estado === 0);
      
      const matchesCategory = this.filterCategory === 'todos' ||
                              (item.producto?.categoria?.nombre === this.filterCategory);

      return matchesSearch && matchesStatus && matchesCategory;
    }).length;

    return Math.ceil(filteredCount / this.itemsPerPage);
  }

  // Lógica para generar los botones de paginación dinámicamente
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
  
  onFilterChange(): void {
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

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
    this.modalDetallesProducto?.show();
  }

  abrirModalConfirmacion(stockItem: stock): void {
    console.log('Stock seleccionado para cambio de estado:', stockItem);
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

  trackById(index: number, stockItem: stock): number | undefined {
    return stockItem.idStock;
  }

  // Método para abrir el modal de stock
  abrirModalStock(stock: stock): void {
    this.modStockValue = stock;
    this.cantidadStock = stock.cantidad;
    console.log('Cargar stock cantidad:', this.cantidadStock);
    console.log('Modificar stock para:', stock);
    
    // Usar setTimeout para asegurar que el DOM esté listo
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
    
    // Limpiar después de un tiempo
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
      this.showModalMessage('Error', 'No se ha seleccionado un stock válido.', false);
      return;
    }

    // Validar que la cantidad esté en el rango permitido
    if (this.cantidadStock < 0 || this.cantidadStock > 150) {
      this.showModalMessage('Error', 'La cantidad debe estar entre 0 y 150.', false);
      return;
    }

    // Calcular la diferencia
    const nuevoStock = this.cantidadStock - this.modStockValue.cantidad;

    console.log(`Modificando stock: ID=${this.modStockValue.idStock}, Diferencia=${nuevoStock}`);

    this.stockService.addorRestarStockProductos(this.modStockValue.idStock, nuevoStock)
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            // Cerrar el modal primero
            this.cerrarModalStock();
            
            // Mostrar mensaje de éxito
            this.showModalMessage(
              'Éxito',
              response.message || 'Stock modificado con éxito.',
              true
            );

            // Actualizar la lista de stocks
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
        }
      });
  }

  // Método alternativo para cargar stock (mantener por compatibilidad)
  cargarStock(stock: stock): void {
    this.abrirModalStock(stock);
  }
}