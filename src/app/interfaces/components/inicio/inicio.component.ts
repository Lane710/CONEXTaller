import {
  Component,
  OnInit,
  AfterViewInit,
  Renderer2,
  ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { DetalleCarrito } from '../../../models/CartModel/DetalleCarrito';
import { StockDTO } from '../../../DTOs/Produc/StockDTO';

declare var bootstrap: any;

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
})
export class InicioComponent implements OnInit, AfterViewInit {
  // Nuevas propiedades para los nuevos servicios
  latestProducts: StockDTO[] = [];
  categoryProducts: { [key: string]: StockDTO[] } = {};
  
  // Propiedades existentes
  ListadoProductos1: StockDTO[] = [];
  ListadoProductos2: StockDTO[] = [];
  ListadoProductos3: StockDTO[] = [];
  ListadoProductos4: StockDTO[] = [];
  
  loading = true;
  errorMessage: string | null = null;
  currentIndex = 0;
  intervalId: any;
  usuarioValido: boolean = false;

  // Definir las categorías principales
  mainCategories = [
    { id: 1, name: 'Computadoras' },
    { id: 3, name: 'Perifericos' },
    { id: 2, name: 'Impresion' },
    { id: 4, name: 'Componentes' },
    { id: 6, name: 'Almacenamiento' }
  ];

  constructor(
    public router: Router, // Cambiado de private a public
    private stockService: StockService,
    private carritoService: CarritoService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadHomepageData();
  }

  ngAfterViewInit(): void {
    this.inicializarCarousels();
    this.enableDragScroll();
  }

  // Cambiado de private a public para poder usarlo en el template
 loadHomepageData(): void {
    this.loading = true;
    this.errorMessage = null;

    // Cargar productos recientes
    this.stockService.getLatestProductsWithStock().subscribe({
      next: (response) => {
        console.log("Respuesta del servicio:", response);
        if (response.data) {
          
          // 🔥 NUEVO: Filtramos primero los que están activos en todos sus niveles
          const productosValidos = response.data.filter((item: any) => this.productoActivoYVisible(item));

          // Aplicamos el slice sobre los ya filtrados
          this.latestProducts = productosValidos.slice(0, 15).map((item: any) => ({
            ...item,
            anadidoAlCarrito: false
          }));
        }
        this.loadCategoryProducts();
      },
      error: (error) => {
        console.error('Error loading latest products:', error);
        this.errorMessage = 'Error al cargar productos recientes';
        this.loading = false;
      }
    });
  }
  private loadCategoryProducts(): void {
    let loadedCategories = 0;
    const totalCategories = this.mainCategories.length;

    if (totalCategories === 0) {
      this.loading = false;
      return;
    }

    this.mainCategories.forEach(category => {
      this.stockService.getProductsByCategory(category.id).subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            
            // 🔥 NUEVO: Filtramos primero los que están activos en todos sus niveles
            const productosValidos = response.data.filter((item: any) => this.productoActivoYVisible(item));

            this.categoryProducts[category.name] = productosValidos
              .slice(0, 15) // Solo primeros 15 productos válidos
              .map((item: any) => ({
                ...item,
                anadidoAlCarrito: false
              }));
          }
          loadedCategories++;
          
          // Cuando todas las categorías se carguen, ocultar loading
          if (loadedCategories === totalCategories) {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error(`Error loading category ${category.name}:`, error);
          loadedCategories++;
          if (loadedCategories === totalCategories) {
            this.loading = false;
          }
        }
      });
    });
  }

  // Método para navegar al login - agregado
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Métodos existentes (se mantienen igual)
  private inicializarCarousels(): void {
    const carousels = this.el.nativeElement.querySelectorAll(
      '.carousel-inner.draggable'
    );

    carousels.forEach((carousel: HTMLElement) => {
      let isDragging = false;
      let startX: number;
      let scrollLeft: number;

      const iniciarArrastre = (x: number) => {
        isDragging = true;
        startX = x - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        this.renderer.addClass(carousel, 'dragging');
      };

      const detenerArrastre = () => {
        isDragging = false;
        this.renderer.removeClass(carousel, 'dragging');
      };

      const moverArrastre = (x: number) => {
        if (!isDragging) return;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
      };

      // Eventos de mouse
      this.renderer.listen(carousel, 'mousedown', (e: MouseEvent) =>
        iniciarArrastre(e.pageX)
      );
      this.renderer.listen(carousel, 'mouseup', detenerArrastre);
      this.renderer.listen(carousel, 'mouseleave', detenerArrastre);
      this.renderer.listen(carousel, 'mousemove', (e: MouseEvent) =>
        moverArrastre(e.pageX)
      );

      // Eventos táctiles
      this.renderer.listen(carousel, 'touchstart', (e: TouchEvent) =>
        iniciarArrastre(e.touches[0].pageX)
      );
      this.renderer.listen(carousel, 'touchend', detenerArrastre);
      this.renderer.listen(carousel, 'touchmove', (e: TouchEvent) =>
        moverArrastre(e.touches[0].pageX)
      );
    });
  }

  paginateProducts(items: StockDTO[], itemsPerPage: number): StockDTO[][] {
    const result: StockDTO[][] = [];
    if (!items || items.length === 0) return result;
    for (let i = 0; i < items.length; i += itemsPerPage) {
      result.push(items.slice(i, i + itemsPerPage));
    }
    return result;
  }

  AddProductCarrito(stockItem: StockDTO): void {
    const usuarioId = localStorage.getItem('current_username');
    this.errorMessage = null;

    if (!usuarioId) {
      this.mostrarModalSesionRequerida();
      return;
    }

    const detalle: DetalleCarrito = {
      stock: stockItem,
      cantidad: 1,
      precioUnitario: (stockItem.producto.precio ?? 0),
      idDetalleCarrito: 0,
      subtotal: 0,
    };

    this.carritoService.agregarProductoACarrito(usuarioId, detalle).subscribe({
      next: () => {
        console.log('Producto agregado al carrito con éxito');
        // Actualizar estado visual del botón
        stockItem.anadidoAlCarrito = true;
        setTimeout(() => {
          stockItem.anadidoAlCarrito = false;
        }, 2000);
      },
      error: (err) => {
        console.error('Error al agregar producto al carrito:', err);
        this.errorMessage =
          'Hubo un problema al añadir el producto al carrito. Inténtalo de nuevo.';
      },
    });
  }

  private mostrarModalSesionRequerida(): void {
    const modalElement = document.getElementById('modalSesionRequerida');
    if (!modalElement) return;

    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    const btnIrLogin = document.getElementById('btnIrLogin');
    if (btnIrLogin) btnIrLogin.onclick = () => {
      modal.hide();
      this.router.navigate(['/login']);
    };

    const btnOkModal = document.getElementById('btnOkModal');
    if (btnOkModal) btnOkModal.onclick = () => modal.hide();
  }

  Details(stockItem: StockDTO): void {
    this.router.navigate(['/home/DetailProduct', stockItem.idStock]);
    console.log('Detalles del producto');
  }

  // En tu inicio.component.ts
  scrollCarousel(carouselId: string, direction: number): void {
    const carousel = document.getElementById(`carousel-${carouselId}`);
    if (carousel) {
      const scrollAmount = 300; // Ajusta este valor según el ancho de tus productos
      carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  
  // Opcional: Agregar soporte para arrastrar con el mouse
  enableDragScroll(): void {
    const carousels = document.querySelectorAll('.products-carousel');
    
    carousels.forEach((carousel) => {
      // Verificar que es un HTMLElement antes de hacer el casting
      if (!(carousel instanceof HTMLElement)) {
        console.warn('Elemento del carrusel no es un HTMLElement');
        return;
      }

      const htmlCarousel = carousel as HTMLElement;
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      const handleMouseDown = (e: MouseEvent) => {
        isDown = true;
        htmlCarousel.classList.add('active');
        startX = e.pageX - htmlCarousel.offsetLeft;
        scrollLeft = htmlCarousel.scrollLeft;
      };

      const handleMouseLeave = () => {
        isDown = false;
        htmlCarousel.classList.remove('active');
      };

      const handleMouseUp = () => {
        isDown = false;
        htmlCarousel.classList.remove('active');
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - htmlCarousel.offsetLeft;
        const walk = (x - startX) * 2;
        htmlCarousel.scrollLeft = scrollLeft - walk;
      };

      // Agregar event listeners
      htmlCarousel.addEventListener('mousedown', handleMouseDown);
      htmlCarousel.addEventListener('mouseleave', handleMouseLeave);
      htmlCarousel.addEventListener('mouseup', handleMouseUp);
      htmlCarousel.addEventListener('mousemove', handleMouseMove);
    });
  }

  // ==========================================
  // --- VALIDADOR DE ESTADOS EN CASCADA ---
  // ==========================================
  // ==========================================
  // --- VALIDADOR DE ESTADOS EN CASCADA ---
  // ==========================================
  private productoActivoYVisible(item: any): boolean {
    try {
      if (!item || !item.producto) return false;

      // Imprimimos el primer producto en consola para que veas qué datos están llegando realmente
      // Puedes borrar este console.log después de revisar
      // console.log("Revisando producto:", item.producto.nombre, item.producto);

      // 1. Validar Producto (Rechazar si es explícitamente 0 o false)
      const estProd = item.producto.estado;
      if (estProd === 0 || estProd === false || estProd === '0') {
        return false; 
      }

      // 2. Validar Subcategoría (Rechazar si existe y es explícitamente false o 0)
      const subcat = item.producto.subcategoria;
      if (subcat && (subcat.estado === false || subcat.estado === 0 || subcat.estado === '0')) {
        return false;
      }

      // 3. Validar Categoría (Rechazar si existe y es explícitamente false o 0)
      const cat = subcat?.categoria;
      if (cat && (cat.estado === false || cat.estado === 0 || cat.estado === '0')) {
        return false;
      }

      // Si pasa todas las validaciones anteriores (o si los datos de sub/cat no vinieron en el DTO), se muestra.
      return true;

    } catch (e) {
      console.error("Error validando el estado del producto", e);
      return false; // Por seguridad, si hay error, no lo mostramos
    }
  }
}