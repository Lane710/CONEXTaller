import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';


import { stock } from '../../../models/ProductoStockModel/stock';
import { categoria } from '../../../models/ProductoStockModel/categorias';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { ProductosService } from '../../../services/ProductosServis/productos.service';
import { ApiResponse } from '../../../models/api-response';

declare var bootstrap: any;

@Component({
  selector: 'app-listar-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, RouterLink, NgClass],
  templateUrl: './listar.component.html',
  styleUrls: ['./listar.component.css']
})
export class ListarComponent implements OnInit, AfterViewInit {
  stocks: stock[] = [];
  stockSeleccionado: stock | null = null;
  categorias: categoria[] = [];

  isLoading: boolean = true;
  errorMessage: string | null = null;

  showModal: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];
  isSuccessModal: boolean = false;

  @ViewChild('confirmarAccionModal') confirmarAccionModalRef!: ElementRef;
  private confirmarAccionModal: any;

  @ViewChild('modalDetallesProductoRef') modalDetallesProductoRef!: ElementRef;
  private modalDetallesProducto: any;

  // --- PROPIEDADES DE PAGINACIÓN ---
  currentPage: number = 1;
  itemsPerPage: number = 10; // Mostrar 10 productos por página
  totalPages: number = 0;
  paginatedStocks: stock[] = []; // Los productos que se muestran en la página actual

  constructor(
    private stockService: StockService,
    private productosService: ProductosService,
    // private productoImagenService: ProductoImagenService, // Descomenta si lo usas
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
  }

  /**
   * Obtiene todos los ítems de stock desde el servicio y aplica paginación.
   */
  getStocks(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.stockService.findAll().subscribe({
      next: (response: ApiResponse) => {
        console.log('Respuesta del servicio de stock:', response);
        if (response && response.data) {
          this.stocks = response.data as stock[];
          this.isLoading = false;
          this.applyPagination(); // Aplicar paginación después de cargar todos los datos
        } else {
          this.errorMessage = response.message || 'No se encontraron registros de stock.';
          this.stocks = [];
          this.isLoading = false;
          this.showModalMessage('Información', this.errorMessage, false);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Error al cargar el stock: ' + (err.message || 'Error desconocido');
        this.isLoading = false;
        console.error('Error al obtener el stock:', err);
        this.showModalMessage('Error', this.errorMessage, false);
      }
    });
  }

  /**
   * Aplica la lógica de paginación al array 'stocks'.
   */
  applyPagination(): void {
    this.totalPages = Math.ceil(this.stocks.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedStocks = this.stocks.slice(startIndex, endIndex);
  }

  /**
   * Cambia la página actual del paginador.
   * @param page El número de página al que ir.
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  /**
   * Getter público para verificar si el modal de detalles del producto está visible.
   * Resuelve el error de acceso a propiedad privada en el template.
   */
  isModalDetallesProductoShown(): boolean {
    // La propiedad 'isShown' es específica de la instancia de Bootstrap Modal
    return this.modalDetallesProducto && this.modalDetallesProducto._isShown;
  }

  // --- Métodos existentes (sin cambios) ---
  loadCategorias(): void {
    this.productosService.getCategorias().subscribe({
      next: (response: ApiResponse) => {
        if (response.success && response.data) {
          this.categorias = response.data as categoria[];
          console.log('Categorías cargadas:', this.categorias);
        } else {
          console.error('Error al cargar categorías:', response.message);
          this.showModalMessage('Error', 'No se pudieron cargar las categorías: ' + response.message, false);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error HTTP al cargar categorías:', err);
        this.showModalMessage('Error', 'Error de conexión al cargar categorías: ' + (err.message || 'Error desconocido'), false);
      }
    });
  }

  getCategoryName(idCategoria: number | undefined): string {
    if (idCategoria === undefined || idCategoria === null) {
      return 'N/A';
    }
    const categoriaEncontrada = this.categorias.find(cat => cat.idCategoria === idCategoria);
    return categoriaEncontrada ? categoriaEncontrada.nombre : 'Desconocida';
  }

  verDetallesStock(stockItem: stock): void {
    this.stockSeleccionado = stockItem;
    // if (stockItem.producto?.idProducto) { // Descomenta si usas ProductoImagenService
    //   this.productoImagenService.getProductImages(stockItem.producto.idProducto).subscribe({
    //     next: (response: ApiResponse) => {
    //       if (response.success && response.data) {
    //         console.log('Imágenes secundarias cargadas:', response.data);
    //       } else {
    //         console.warn('No se encontraron imágenes secundarias o hubo un error:', response.message);
    //       }
    //     },
    //     error: (err: HttpErrorResponse) => {
    //       console.error('Error al cargar imágenes secundarias:', err);
    //     }
    //   });
    // }
    this.modalDetallesProducto?.show();
  }

  abrirModalConfirmacion(stockItem: stock): void {
    this.stockSeleccionado = stockItem;
    this.confirmarAccionModal?.show();
  }

  confirmarAccionProducto(): void {
    console.log('Intentando confirmar acción de producto...');
    if (this.stockSeleccionado && this.stockSeleccionado.producto?.idProducto !== undefined && this.stockSeleccionado.producto.idProducto !== null) {
      const idProducto = this.stockSeleccionado.producto.idProducto;
      console.log('ID de producto a modificar:', idProducto);

      this.productosService.toggleProductStatus(idProducto).subscribe({
        next: (response: ApiResponse) => {
          console.log('Respuesta del servicio toggleProductStatus:', response);
          if (response.success) {
            this.showModalMessage('Éxito', response.message || 'Estado del producto cambiado con éxito.', true);
            this.confirmarAccionModal?.hide();
            this.getStocks(); // Recarga la lista para reflejar el cambio
          } else {
            this.showModalMessage('Error', response.message || 'Error al cambiar el estado del producto.', false);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error en la comunicación al cambiar el estado del producto:', err);
          this.showModalMessage('Error', 'Error de conexión al cambiar el estado del producto: ' + (err.message || 'Error desconocido'), false);
        }
      });
    } else {
      console.log('stockSeleccionado o ID de producto no válido para confirmar acción.');
      this.showModalMessage('Error', 'Registro de stock no seleccionado o ID de producto no válido.', false);
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
}
