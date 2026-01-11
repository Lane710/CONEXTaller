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

// --- NUEVAS IMPORTACIONES REQUERIDAS ---
import { ProductoValorPropiedadService } from '../../../services/ProductosServis/Secundarios/producto-propiedad.service';
import { ProductoValorPropiedad } from '../../../models/ProductoStockModel/ProductoValorPropiedad';


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

  // --- CAMBIO DE TIPO PARA QUE COINCIDA CON LOS DATOS REALES ---
  especificaciones: ProductoValorPropiedad[] = [];
  atributos: ProductoValorPropiedad[] = [];
  caracteristicas: ProductoValorPropiedad[] = [];
  // ---

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
    // --- SERVICIO AÑADIDO PARA CARGAR PROPIEDADES ---
    private productoValorPropiedadService: ProductoValorPropiedadService, 
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

      // Resetea todo antes de cargar
      this.isLoading = true;
      this.error = null;
      this.productDetails = null;
      this.especificaciones = [];
      this.atributos = [];
      this.caracteristicas = [];
      this.ImagenProducts = [];

      this.cargarDetallesProducto();
    });
  }

  private cargarDetallesProducto(): void {
    if (!this.productId) return;

    this.stockService.findByIdStock(this.productId).subscribe({
      next: (response) => {
        // ======================================================
        // ¡¡AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL!!
        // (Cambiado de 'response.data[0]' a 'response.data')
        // ======================================================
        this.productDetails = response.data;
        // ======================================================

        // Si this.productDetails es nulo, el ID no existe en el backend
        if (!this.productDetails) {
          this.error = 'No se encontró un producto con el ID proporcionado.';
          this.isLoading = false;
          return;
        }

        this.isLoading = false; // Marcamos como cargado aquí

        // Asignamos la imagen principal
        if (this.productDetails.producto?.imagen) {
          this.mainImageUrl = this.productDetails.producto.imagen;
        }

        // Obtenemos el ID real del producto (no del stock)
        const idProductoReal = this.productDetails.producto?.idProducto;

        if (idProductoReal) {
          // Llamamos a las funciones que dependen del ID del producto
          this.cargarImagenesSecundarias(idProductoReal);
          this.cargarPropiedadesProducto(idProductoReal);
        }

        this.cargarProductosSimilares(); // Esta es independiente
      },
      error: (err) => {
        console.error('Error al cargar detalles del producto:', err);
        this.error = 'Error al cargar los detalles del producto.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga las propiedades (especificaciones, atributos, características)
   * asociadas al ID del producto.
   */
  private cargarPropiedadesProducto(idProducto: number): void {
    this.productoValorPropiedadService.findByProductoId(idProducto).subscribe({
       next: (response) => {
         const todasLasPropiedades: ProductoValorPropiedad[] = response.data || [];
         
         // Filtramos las propiedades en sus arrays correspondientes
         this.especificaciones = todasLasPropiedades.filter(
           p => p.tipoPropiedad.tipo === 'especificacion'
         );
         this.atributos = todasLasPropiedades.filter(
           p => p.tipoPropiedad.tipo === 'atributo'
         );
         this.caracteristicas = todasLasPropiedades.filter(
           p => p.tipoPropiedad.tipo === 'caracteristica'
         );
       },
       error: (err) => {
         console.error('Error al cargar propiedades del producto:', err);
       }
    });
  }

  /**
   * Carga las imágenes secundarias asociadas al ID del producto.
   */
  private cargarImagenesSecundarias(idProducto: number): void {
    this.productoImagenService.getProductImages(idProducto).subscribe({
      next: (response) => {
        this.ImagenProducts = response.data;
      },
      error: (err) => console.error('Error al obtener imágenes secundarias:', err)
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

  /**
   * Carga productos de categorías similares para el carrusel.
   */
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

  /**
   * Cambia la imagen principal al hacer clic en una miniatura.
   */
  changeMainImage(imageUrl: string): void {
    this.mainImageUrl = imageUrl;
  }

  /**
   * Agrega el producto actual al carrito de compras.
   */
  AddProductCarrito(stockItem: StockDTO): void {
    const usuarioId = localStorage.getItem('current_username');
    if (!usuarioId) {
      alert('Debes iniciar sesión para agregar productos al carrito.');
      return;
    }

    const precioUnitario = stockItem.producto.precio ?? 0;

    const detalle: DetalleCarrito = {
      stock: stockItem, 
      cantidad: this.cantidadSeleccionada,
      precioUnitario: precioUnitario.toString(),
      subtotal: (precioUnitario * this.cantidadSeleccionada).toString() // Calculamos el subtotal
    };

    this.carritoService.agregarProductoACarrito(usuarioId, detalle).subscribe({
      next: () => alert('¡Producto añadido al carrito!'),
      error: (err) => {
        console.error('Error al agregar producto al carrito:', err);
        alert('Hubo un problema al añadir el producto al carrito.');
      }
    });
  }

  // --- FUNCIONES DEL CARRUSEL ---

  scrollCarousel(direction: 'left' | 'right'): void {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;
    const scrollAmount = 300;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }

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