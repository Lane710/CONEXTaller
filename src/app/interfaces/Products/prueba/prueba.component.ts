// src/app/prueba.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ProductosService } from '../../../services/productos.service'; // Ajusta la ruta si es necesario
import { productos } from '../../../models/productos'; // Ajusta la ruta si es necesario
import { ApiResponse } from '../../../models/api-response'; // Ajusta la ruta si es necesario
import { CommonModule, NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common'; // Importa CommonModule y Pipes

declare var bootstrap: any; // Declaración para Bootstrap JS

@Component({
  selector: 'app-prueba',
  standalone: true, // Indica que este es un componente standalone
  imports: [CommonModule,  CurrencyPipe], // Asegúrate de que NgFor, NgIf, CurrencyPipe y DatePipe estén aquí
  templateUrl: './prueba.component.html',
  styleUrl: './prueba.component.css'
})
export class PruebaComponent implements OnInit {
  @ViewChild('miModal') miModalRef!: ElementRef;
  private miModal: any;

  products: productos[] = []; // Todos los productos obtenidos del backend
  paginatedProducts: productos[] = []; // Productos para la página actual

  currentPage: number = 1; // Página actual
  itemsPerPage: number = 25; // Productos por página (5x5)
  totalPages: number = 0; // Total de páginas

  errorMessage: string = ''; // Para mostrar mensajes de error

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.findAllProducts(); // Cargar todos los productos al iniciar
  }

  ngAfterViewInit(): void {
    // Inicialización del modal de Bootstrap
    if (this.miModalRef) {
      this.miModal = new bootstrap.Modal(this.miModalRef.nativeElement);
    }
  }

  abrirModal(): void {
    this.miModal?.show();
  }

  cerrarModal(): void {
    this.miModal?.hide();
  }

  // Función para barajar (mezclar) un array (Fisher-Yates shuffle)
  private shuffleArray(array: any[]): any[] {
    let currentIndex = array.length, randomIndex;

    // Mientras queden elementos a barajar.
    while (currentIndex !== 0) {
      // Seleccionar un elemento restante.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // E intercambiarlo con el elemento actual.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  // Método para obtener todos los productos del servicio
  findAllProducts(): void {
    this.productosService.findAll().subscribe({
      next: (response: ApiResponse) => {
        if (response.success === true && response.data) {
          this.products = response.data;
          // ¡CAMBIO AQUÍ! Barajar los productos después de obtenerlos
          this.products = this.shuffleArray(this.products);

          this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
          this.paginateProducts(); // Paginar los productos después de cargarlos
          this.errorMessage = ''; // Limpiar cualquier error previo
        } else {
          this.errorMessage = response.message || 'No se pudieron cargar los productos.';
          this.products = [];
          this.paginatedProducts = [];
          this.totalPages = 0;
        }
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
        this.errorMessage = 'Error de conexión con el servidor o API: ' + (error.message || 'Desconocido');
        this.products = [];
        this.paginatedProducts = [];
        this.totalPages = 0;
      }
    });
  }

  // Método para paginar los productos
  paginateProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);
  }

  // Métodos para cambiar de página
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateProducts();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateProducts();
    }
  }

  // Método para generar un array de números de página para el paginador
  get pageNumbers(): number[] {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
}
