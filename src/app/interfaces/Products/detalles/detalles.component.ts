// src/app/detalles/detalles.component.ts

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass, CurrencyPipe } from '@angular/common';
import { StockDTO } from '../../../DTOs/Produc/StockDTO';
import { ActivatedRoute, Router } from '@angular/router';
import { StockService } from '../../../services/ProductosServis/stock.service';

import { ProductoImagenService } from '../../../services/ProductosServis/Secundarios/producto-imagen.service'; // ¡Importa este servicio!
import { ProductoImagen } from '../../../models/ProductoStockModel/ProductoImagen';
import { CarritoService } from '../../../services/CartServis/carrito.service';

import { FormsModule } from '@angular/forms';
import { DetalleCarrito } from '../../../models/CartModel/DetalleCarrito';
import { DetalleCarritoProducto } from '../../../DTOs/Cart/DetalleCarritoProducto';
import { TipoPropiedadService } from '../../../services/ProductosServis/tipo-propiedad-service.service';
import { tipoPropiedad } from '../../../models/ProductoStockModel/tipoPropiedad';

// Interfaz para la estructura de la propiedad

// Nueva interfaz para los productos del carrusel (si no la tienes ya)

@Component({
  selector: 'app-detalles',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, CurrencyPipe, FormsModule],
  templateUrl: './detalles.component.html',
  styleUrl: './detalles.component.css'
})
export class DetallesComponent implements OnInit, AfterViewInit {
  productId: number | null = null;
  productDetails: StockDTO | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  especificaciones: tipoPropiedad[] = [];
  atributos: tipoPropiedad[] = [];
  caracteristicas: tipoPropiedad[] = [];
  productosParecidos: StockDTO[]=[]; // Productos similares para mostrar en el carrusel
  // Variables para la galería de imágenes
  mainImageUrl: string = ''; // La URL de la imagen principal mostrada
  ImagenProducts: ProductoImagen[] = []; // Tu variable global para las imágenes secundarias
  techoProducts: any[] = [];// Declarar techoProducts aquí para que esté disponible en el template
cantidadSeleccionada: number = 1; // Declara la variable para la cantidad seleccionada del producto
  // Productos para el carrusel (datos simulados)
  

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  // Variables para el arrastre del carrusel
  isDragging = false;
  startX!: number;
  scrollLeft!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private ProductoPropiedadService: TipoPropiedadService,
    private productoImagenService: ProductoImagenService, // ¡Inyecta este servicio!
    private carritoService: CarritoService // Asegúrate de importar y usar el servicio de carrito
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.productId = +idParam;
        console.log('ID del producto:', this.productId);
        this.stockService.findByIdStock(this.productId).subscribe({
          next: (response) => {
            this.productDetails = response.data[0];
            this.isLoading = false;
            console.log('Detalles del producto:', this.productDetails);
            
            // Establecer la imagen principal inicial
            if (this.productDetails && this.productDetails.producto.imagen) {
              this.mainImageUrl = this.productDetails.producto.imagen;
            }

            //this.detallesProducto();
            this.getImagenesSecundariasPRoducto(); // Llama a la función para cargar imágenes secundarias
          },
          error: () => {
            this.error = 'Error al cargar los detalles del producto.';
            this.isLoading = false;
            console.error(this.error);
          }
        });
      } else {
        this.error = 'No se encontró el ID del producto en la URL.';
        this.isLoading = false;
        console.error(this.error);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.carouselContainer && this.carouselContainer.nativeElement) {
      const container = this.carouselContainer.nativeElement;
      container.addEventListener('mousedown', this.startDragging.bind(this));
      container.addEventListener('mouseleave', this.stopDragging.bind(this));
      container.addEventListener('mouseup', this.stopDragging.bind(this));
      container.addEventListener('mousemove', this.onDragging.bind(this));

      // Añadir eventos táctiles explícitamente para una mejor compatibilidad móvil
      container.addEventListener('touchstart', this.startDragging.bind(this));
      container.addEventListener('touchend', this.stopDragging.bind(this));
      container.addEventListener('touchmove', this.onDragging.bind(this));
    }
  }

  /*detallesProducto(): void {
    if (this.productId) {
      this.ProductoPropiedadService.listarAtributoProducto(this.productId).subscribe({
        next: (response) => {
          console.log('Propiedades del producto:', response);
          this.listadoDeProductosCategoriaComputadoras();
          if (response && response.data) {
            this.especificaciones = [];
            this.atributos = [];
            this.caracteristicas = [];

            response.data.forEach((prop: ProductoPropiedad) => {
              if (prop.tipo === 'especificacion') {
                this.especificaciones.push(prop);
              } else if (prop.tipo === 'atributo') {
                this.atributos.push(prop);
              } else if (prop.tipo === 'caracteristica') {
                this.caracteristicas.push(prop);
              }
            });
          }
        },
        error: (err) => {
          console.error('Error al obtener las propiedades del producto:', err);
        }
      });
    } else {
      console.error('No se pudo obtener las propiedades del producto: ID no disponible.');
    }
  }*/

  // TU FUNCIÓN EXISTENTE PARA IMÁGENES SECUNDARIAS
  getImagenesSecundariasPRoducto(): void {
    if (this.productId) { // Asegúrate de que productId no sea null
      this.productoImagenService.getProductImages(this.productId).subscribe({
        next: (response) => { 
          console.log('Imágenes secundarias del producto:', response);
          this.ImagenProducts = response.data;
          console.log('URLs de las imágenes secundarias:', this.ImagenProducts);
        },
        error: (err) => {
          console.error('Error al obtener las imágenes secundarias:', err);
        }
      });
    }
  }

  // NUEVO MÉTODO: Cambiar la imagen principal al hacer clic en una miniatura
  changeMainImage(imageUrl: string): void {
    this.mainImageUrl = imageUrl;
  }

  listadoDeProductosCategoriaComputadoras(): void {
    this.stockService.ProductoporCategoria(2, 3, 5).subscribe({
      next: (response) => {
        this.productosParecidos = response.data;
        console.log('Productos similares para el carrusel:', this.productosParecidos);

        // Mezclar el array de productos de forma aleatoria
        // Asegúrate de que response.data sea un array válido y no esté vacío
        if (this.productosParecidos && this.productosParecidos.length > 0) {
          const productosMezclados = [...this.productosParecidos].sort(() => 0.5 - Math.random()); // Usar spread para evitar mutar el original

          // Tomar los primeros 7 productos después de mezclar
          this.techoProducts = productosMezclados.slice(0, 7); // Asigna los 7 productos aleatorios a techoProducts

          console.log('7 productos aleatorios para el carrusel:', this.techoProducts);
        } else {
          this.techoProducts = []; // Si no hay productos, asegúrate de que techoProducts sea un array vacío
          console.log('No se encontraron productos para el carrusel.');
        }
      },
      error: (error) => {
        console.error('Error al obtener productos por categoría:', error);
      }
    });
    
  }



//Anadir producto al carrito
AddProductCarrito(producto: StockDTO) {
   const usuarioId = localStorage.getItem('current_username');

    const request: DetalleCarrito = {
      producto: producto.producto,
      cantidad: this.cantidadSeleccionada, // ¡Aquí usas la variable!
      precioUnitario: parseFloat(producto.producto.precio||'0').toString(),
    };

    this.carritoService.agregarProductoACarrito(usuarioId||'', request).subscribe({
      next: (response) => {
        console.log('Producto agregado al carrito con éxito:', response);
        alert('¡Producto añadido al carrito!');
      },
      error: (error) => {
        console.error('Error al agregar producto al carrito:', error);
        alert('Hubo un problema al añadir el producto al carrito.');
      },
    });
  }












  /////////////////////////////////////////////////////////////////
  // Métodos para el desplazamiento del carrusel con botones
  scrollCarousel(direction: 'left' | 'right'): void {
    const container = this.carouselContainer.nativeElement;
    const scrollAmount = 300;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  // Métodos para arrastrar con el mouse y touch
  startDragging(e: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    const container = this.carouselContainer.nativeElement;
    this.startX = 'touches' in e ? e.touches[0].pageX - container.offsetLeft : e.pageX - container.offsetLeft;
    this.scrollLeft = container.scrollLeft;
    container.style.cursor = 'grabbing';
  }

  stopDragging(): void {
    this.isDragging = false;
    const container = this.carouselContainer.nativeElement;
    container.style.cursor = 'grab';
  }

  onDragging(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();

    const container = this.carouselContainer.nativeElement;
    const x = 'touches' in e ? e.touches[0].pageX - container.offsetLeft : e.pageX - container.offsetLeft;
    const walk = (x - this.startX) * 1;
    container.scrollLeft = this.scrollLeft - walk;
  }


}