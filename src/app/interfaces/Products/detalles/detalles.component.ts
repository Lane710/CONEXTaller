// src/app/detalles/detalles.component.ts

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core'; // Añadir AfterViewInit
import { CommonModule, NgIf, NgFor, NgClass, CurrencyPipe } from '@angular/common'; // Asegúrate de CurrencyPipe si no está
import { StockDTO } from '../../../DTOs/Produc/StockDTO';
import { ActivatedRoute, Router } from '@angular/router';
import { StockService } from '../../../services/stock.service';
import { ProductoPropiedadService } from '../../../services/Secundarios/producto-propiedad.service';

// Interfaz para la estructura de la propiedad
interface ProductProperty {
  idPropiedad: number;
  id_producto: number;
  tipo: 'atributo' | 'caracteristica' | 'especificacion';
  nombre: string;
  valor: string;
}

// Nueva interfaz para los productos del carrusel
interface TechProduct {
  id: number;
  nombre: string;
  imagenUrl: string;
  precio: number;
  disponible: boolean;
  stock: number;
}

@Component({
  selector: 'app-detalles',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, CurrencyPipe], // Añadir CurrencyPipe aquí
  templateUrl: './detalles.component.html',
  styleUrl: './detalles.component.css'
})
export class DetallesComponent implements OnInit, AfterViewInit { // Implementar AfterViewInit
  productId: number | null = null;
  productDetails: StockDTO | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  especificaciones: ProductProperty[] = [];
  atributos: ProductProperty[] = [];
  caracteristicas: ProductProperty[] = [];

  // Productos para el carrusel (datos simulados)
  techoProducts: TechProduct[] = [
    { id: 1, nombre: 'Smartphone S25 Ultra', imagenUrl: 'https://via.placeholder.com/200x200?text=S25+Ultra', precio: 999.99, disponible: true, stock: 50 },
    { id: 2, nombre: 'Laptop Gamer Xtreme', imagenUrl: 'https://via.placeholder.com/200x200?text=Laptop+Gamer', precio: 1499.00, disponible: true, stock: 5 },
    { id: 3, nombre: 'Auriculares Inalámbricos Pro', imagenUrl: 'https://via.placeholder.com/200x200?text=Auriculares+Pro', precio: 199.50, disponible: false, stock: 0 },
    { id: 4, nombre: 'Smartwatch Titan', imagenUrl: 'https://via.placeholder.com/200x200?text=Smartwatch', precio: 249.00, disponible: true, stock: 12 },
    { id: 5, nombre: 'Monitor Curvo 4K', imagenUrl: 'https://via.placeholder.com/200x200?text=Monitor+Curvo', precio: 599.99, disponible: true, stock: 2 },
    { id: 6, nombre: 'Teclado Mecánico RGB', imagenUrl: 'https://via.placeholder.com/200x200?text=Teclado+RGB', precio: 89.99, disponible: true, stock: 20 },
    { id: 7, nombre: 'Cámara Mirrorless Alpha', imagenUrl: 'https://via.placeholder.com/200x200?text=Camara+Alpha', precio: 1200.00, disponible: true, stock: 1 },
    { id: 8, nombre: 'Router Wi-Fi 6', imagenUrl: 'https://via.placeholder.com/200x200?text=Router+Wi-Fi+6', precio: 120.00, disponible: true, stock: 15 },
    { id: 9, nombre: 'Disco SSD NVMe 1TB', imagenUrl: 'https://via.placeholder.com/200x200?text=SSD+1TB', precio: 150.00, disponible: true, stock: 8 }
  ];

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  // Variables para el arrastre del carrusel
   isDragging = false;
  startX!: number;
  scrollLeft!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private ProductoPropiedadService: ProductoPropiedadService
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
            this.detallesProducto();
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

      // Eventos para arrastrar con el mouse (también funcionan con touch en algunos casos)
      container.addEventListener('mousedown', this.startDragging.bind(this));
      container.addEventListener('mouseleave', this.stopDragging.bind(this));
      container.addEventListener('mouseup', this.stopDragging.bind(this));
      container.addEventListener('mousemove', this.onDragging.bind(this));

      // **OPCIONAL PERO RECOMENDADO: Añadir eventos táctiles explícitamente**
      // Esto asegura un comportamiento más consistente y control en móviles
      container.addEventListener('touchstart', this.startDragging.bind(this));
      container.addEventListener('touchend', this.stopDragging.bind(this));
      container.addEventListener('touchmove', this.onDragging.bind(this));
    }
  }

  detallesProducto(): void {
    if (this.productId) {
      this.ProductoPropiedadService.listarAtributoProducto(this.productId).subscribe({
        next: (response) => {
          console.log('Propiedades del producto:', response);
          if (response && response.data) {
            this.especificaciones = [];
            this.atributos = [];
            this.caracteristicas = [];

            response.data.forEach((prop: ProductProperty) => {
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
  }

  // Métodos para el desplazamiento del carrusel con botones
  scrollCarousel(direction: 'left' | 'right'): void {
    const container = this.carouselContainer.nativeElement;
    const scrollAmount = 300; // Puedes ajustar la cantidad de scroll

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  // Métodos para arrastrar con el mouse
  startDragging(e: MouseEvent | TouchEvent): void { // Aceptar MouseEvent o TouchEvent
    this.isDragging = true;
    const container = this.carouselContainer.nativeElement;
    // Determinar la posición X inicial basada en el tipo de evento
    this.startX = 'touches' in e ? e.touches[0].pageX - container.offsetLeft : e.pageX - container.offsetLeft;
    this.scrollLeft = container.scrollLeft;
    container.style.cursor = 'grabbing';
  }

  stopDragging(): void {
    this.isDragging = false;
    const container = this.carouselContainer.nativeElement;
    container.style.cursor = 'grab';
  }

  onDragging(e: MouseEvent | TouchEvent): void { // Aceptar MouseEvent o TouchEvent
    if (!this.isDragging) return;
    e.preventDefault(); // Prevenir selección de texto/imágenes y scroll vertical de la página

    const container = this.carouselContainer.nativeElement;
    // Determinar la posición X actual basada en el tipo de evento
    const x = 'touches' in e ? e.touches[0].pageX - container.offsetLeft : e.pageX - container.offsetLeft;
    const walk = (x - this.startX) * 1;
    container.scrollLeft = this.scrollLeft - walk;
  }


  addToCart(product: TechProduct): void {
    if (product.disponible && product.stock > 0) {
      console.log(`Añadido ${product.nombre} al carrito.`);
      // Aquí iría la lógica real para añadir al carrito
    } else {
      console.log(`${product.nombre} no está disponible.`);
    }
  }

  getAvailabilityText(product: TechProduct): string {
    if (product.stock === 0) {
      return 'Sin stock';
    } else if (product.stock > 0 && product.stock <= 5) {
      return `¡Últimas ${product.stock} unidades!`;
    } else {
      return 'En stock';
    }
  }

  getAvailabilityClass(product: TechProduct): string {
    if (product.stock === 0) {
      return 'out-of-stock';
    } else if (product.stock > 0 && product.stock <= 5) {
      return 'low-stock';
    } else {
      return 'in-stock';
    }
  }
}