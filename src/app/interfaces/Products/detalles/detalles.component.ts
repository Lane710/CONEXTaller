import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass, CurrencyPipe } from '@angular/common';
import { StockDTO } from '../../../DTOs/Produc/StockDTO';
import { ActivatedRoute, Router } from '@angular/router';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { ProductoImagenService } from '../../../services/ProductosServis/Secundarios/producto-imagen.service';
import { ProductoImagen } from '../../../models/ProductoStockModel/ProductoImagen';
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { FormsModule } from '@angular/forms';
import { DetalleCarrito } from '../../../models/CartModel/DetalleCarrito';
import { TipoPropiedadService } from '../../../services/ProductosServis/tipo-propiedad-service.service';
import { tipoPropiedad } from '../../../models/ProductoStockModel/tipoPropiedad';

@Component({
  selector: 'app-detalles',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, CurrencyPipe, FormsModule],
  templateUrl: './detalles.component.html',
  styleUrls: ['./detalles.component.css']
})
export class DetallesComponent implements OnInit, AfterViewInit {
  productId: number | null = null;
  productDetails: StockDTO | null = null;
  isLoading = true;
  error: string | null = null;

  especificaciones: tipoPropiedad[] = [];
  atributos: tipoPropiedad[] = [];
  caracteristicas: tipoPropiedad[] = [];
  productosParecidos: StockDTO[] = [];
  techoProducts: StockDTO[] = [];
  
  mainImageUrl = '';
  ImagenProducts: ProductoImagen[] = [];
  cantidadSeleccionada = 1;

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  // Variables para arrastre del carrusel
  isDragging = false;
  startX!: number;
  scrollLeft!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private productoPropiedadService: TipoPropiedadService,
    private productoImagenService: ProductoImagenService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.error = 'No se encontró el ID del producto en la URL.';
        this.isLoading = false;
        return;
      }

      this.productId = +idParam;
      this.cargarDetallesProducto();
    });
  }

  private cargarDetallesProducto(): void {
    if (!this.productId) return;

    this.stockService.findByIdStock(this.productId).subscribe({
      next: (response) => {
        this.productDetails = response.data[0];
        this.isLoading = false;

        if (this.productDetails?.producto?.imagen) {
          this.mainImageUrl = this.productDetails.producto.imagen;
        }

        this.cargarImagenesSecundarias();
        this.cargarProductosSimilares();
      },
      error: () => {
        this.error = 'Error al cargar los detalles del producto.';
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;

    container.addEventListener('mousedown', this.startDragging.bind(this));
    container.addEventListener('mouseup', this.stopDragging.bind(this));
    container.addEventListener('mouseleave', this.stopDragging.bind(this));
    container.addEventListener('mousemove', this.onDragging.bind(this));

    container.addEventListener('touchstart', this.startDragging.bind(this));
    container.addEventListener('touchend', this.stopDragging.bind(this));
    container.addEventListener('touchmove', this.onDragging.bind(this));
  }

  private cargarImagenesSecundarias(): void {
    if (!this.productId) return;

    this.productoImagenService.getProductImages(this.productId).subscribe({
      next: (response) => {
        this.ImagenProducts = response.data;
      },
      error: (err) => console.error('Error al obtener imágenes secundarias:', err)
    });
  }

  private cargarProductosSimilares(): void {
    this.stockService.ProductoporCategoria(2, 3, 5).subscribe({
      next: (response) => {
        this.productosParecidos = response.data;

        if (this.productosParecidos?.length) {
          const productosMezclados = [...this.productosParecidos].sort(() => 0.5 - Math.random());
          this.techoProducts = productosMezclados.slice(0, 7);
        } else {
          this.techoProducts = [];
        }
      },
      error: (err) => console.error('Error al obtener productos por categoría:', err)
    });
  }

  changeMainImage(imageUrl: string): void {
    this.mainImageUrl = imageUrl;
  }

  AddProductCarrito(stockItem: StockDTO): void {
    const usuarioId = localStorage.getItem('current_username');
    if (!usuarioId) {
      alert('Debes iniciar sesión para agregar productos al carrito.');
      return;
    }

    const detalle: DetalleCarrito = {
      stock: stockItem, // Ahora apunta a StockDTO completo
      cantidad: this.cantidadSeleccionada,
      precioUnitario: (stockItem.producto.precio ?? '0').toString(),
      subtotal: ''
    };

    this.carritoService.agregarProductoACarrito(usuarioId, detalle).subscribe({
      next: () => alert('¡Producto añadido al carrito!'),
      error: (err) => {
        console.error('Error al agregar producto al carrito:', err);
        alert('Hubo un problema al añadir el producto al carrito.');
      }
    });
  }

  // Carrusel con botones
  scrollCarousel(direction: 'left' | 'right'): void {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;
    const scrollAmount = 300;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }

  // Arrastre del carrusel
  startDragging(e: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    const container = this.carouselContainer.nativeElement;
    this.startX = 'touches' in e ? e.touches[0].pageX - container.offsetLeft : e.pageX - container.offsetLeft;
    this.scrollLeft = container.scrollLeft;
    container.style.cursor = 'grabbing';
  }

  stopDragging(): void {
    this.isDragging = false;
    if (this.carouselContainer) this.carouselContainer.nativeElement.style.cursor = 'grab';
  }

  onDragging(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();

    const container = this.carouselContainer.nativeElement;
    const x = 'touches' in e ? e.touches[0].pageX - container.offsetLeft : e.pageX - container.offsetLeft;
    container.scrollLeft = this.scrollLeft - (x - this.startX);
  }
}
