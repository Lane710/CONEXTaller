import { 
  Component, 
  OnInit, 
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { ApiResponse } from '../../../models/api-response';
import Decimal from 'decimal.js';
import { DetalleCarrito } from '../../../models/CartModel/DetalleCarrito';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { Router, RouterLink } from '@angular/router';
import { StockDTO } from '../../../DTOs/dtosBD/StockDTO';

// Interface extendida localmente para manejar el estado del carrito
interface StockConEstado extends StockDTO {
  anadidoAlCarrito?: boolean;
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css',
})
export class CarritoComponent implements OnInit, AfterViewInit {
  username: string = localStorage.getItem('current_username') || '';
  detallesCarrito: DetalleCarrito[] = [];
  detallesCarritoOrdenados: DetalleCarrito[] = [];
  subtotalCarrito: string = '0.00';
  totalCarrito: string = '0.00';
  productosCuadricula: StockConEstado[] = [];
  eliminandoAlgunProducto: boolean = false;

  constructor(
    private carritoService: CarritoService,
    private stockService: StockService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.username) {
      console.warn('No se encontró usuario en localStorage');
      return;
    }
    this.cargarCarrito();
    this.cargarProductosParaCuadricula();
  }

  ngAfterViewInit(): void {
    this.enableDragScroll();
  }

  // --- Métodos para el Carrusel ---

  scrollCarousel(carouselId: string, direction: number): void {
    const carousel = document.getElementById(`carousel-${carouselId}`);
    if (carousel) {
      const scrollAmount = 300;
      carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  enableDragScroll(): void {
    const carousels = document.querySelectorAll('.products-carousel');
    
    carousels.forEach((carousel) => {
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

  AddProductCarrito(stockItem: StockConEstado): void {
    const usuarioId = localStorage.getItem('current_username');
    
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
        stockItem.anadidoAlCarrito = true;
        setTimeout(() => {
          stockItem.anadidoAlCarrito = false;
        }, 2000);
        
        this.cargarCarrito();
      },
      error: (err) => {
        console.error('Error al agregar producto al carrito:', err);
        alert('Hubo un problema al añadir el producto al carrito. Inténtalo de nuevo.');
      },
    });
  }

  private mostrarModalSesionRequerida(): void {
    alert('Para agregar productos al carrito, necesitas iniciar sesión.');
    this.router.navigate(['/login']);
  }

  // --- Métodos para cargar y gestionar el carrito ---

  cargarCarrito(): void {
    console.log('Cargando carrito para usuario:', this.username);
    this.carritoService.listarProductosDeUsuario(this.username).subscribe({
      next: (response: ApiResponse) => {
        console.log('Respuesta del carrito:', response);
        if (!response.success || !response.data) {
          this.detallesCarrito = [];
          this.detallesCarritoOrdenados = [];
          this.calcularTotales();
          return;
        }

        this.detallesCarrito = response.data;
        this.ordenarCarritoAlfabeticamente();
        this.calcularTotales();
      },
      error: (err) => {
        console.error('Error al cargar carrito:', err);
        this.detallesCarrito = [];
        this.detallesCarritoOrdenados = [];
        this.calcularTotales();
      },
    });
  }

  ordenarCarritoAlfabeticamente(): void {
    this.detallesCarritoOrdenados = [...this.detallesCarrito].sort((a, b) => {
      const nombreA = a.stock.producto.nombre.toLowerCase();
      const nombreB = b.stock.producto.nombre.toLowerCase();
      return nombreA.localeCompare(nombreB);
    });
  }

  trackByDetalleId(index: number, item: DetalleCarrito): number {
    return item.idDetalleCarrito || index;
  }

  calcularTotales(): void {
    let subtotal = new Decimal(0);
    this.detallesCarrito.forEach((item) => {
      subtotal = subtotal.plus(new Decimal(item.subtotal || 0));
    });

    this.subtotalCarrito = subtotal.toFixed(2);
    this.totalCarrito = subtotal.toFixed(2);
  }

  cambiarCantidad(idDetalleCarrito: number, operacion: 0 | 1, stockDisponible: number): void {
    const item = this.detallesCarrito.find((d) => d.idDetalleCarrito === idDetalleCarrito);
    if (!item) return;

    if (operacion === 1 && item.cantidad >= stockDisponible) return;
    if (operacion === 0 && item.cantidad <= 1) return;

    this.carritoService.actualizarCantidadDetalle(idDetalleCarrito, operacion).subscribe({
      next: () => this.cargarCarrito(),
      error: (err) => {
        console.error('Error al actualizar cantidad:', err);
        alert('Error al actualizar la cantidad del producto');
      },
    });
  }

  // --- Método para eliminar producto con cargador de pantalla completa ---
  eliminarProducto(idDetalleCarrito: number): void {
    const usuario = localStorage.getItem('current_username') || '';
    
    if (!usuario) {
      console.error('No se encontró usuario en localStorage');
      alert('Error: No se pudo identificar al usuario');
      return;
    }

    // Activar el overlay de carga
    this.eliminandoAlgunProducto = true;

    console.log('Eliminando producto:', { usuario, idDetalleCarrito });
    
    // Simular un delay de 2 segundos antes de hacer la petición real
    setTimeout(() => {
      this.carritoService.eliminarProductoDeCarrito(usuario, idDetalleCarrito).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          
          // Desactivar el overlay de carga
          this.eliminandoAlgunProducto = false;
          
          if (response.success) {
            // Eliminar el producto de la lista localmente
            this.detallesCarrito = this.detallesCarrito.filter(
              detalle => detalle.idDetalleCarrito !== idDetalleCarrito
            );
            this.detallesCarritoOrdenados = [...this.detallesCarrito];
            
            // Recalcular totales
            this.calcularTotales();
            
            console.log('Producto eliminado del carrito exitosamente');
          } else {
            console.error('Error al eliminar producto:', response.message);
            alert('Error al eliminar el producto: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error en la petición de eliminación:', error);
          alert('Error de conexión al eliminar el producto');
          this.eliminandoAlgunProducto = false;
        }
      });
    }, 500); // 2 segundos de delay
  }

  cargarProductosParaCuadricula(): void {
    this.stockService.ProductoporCategoria(2, 6, 5).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.productosCuadricula = res.data.slice(0, 15).map((item: StockDTO) => ({
            ...item,
            anadidoAlCarrito: false
          } as StockConEstado));
        }
      },
      error: (err) => console.error('Error al cargar productos para cuadrícula:', err),
    });
  }

  redirectToDetails(stock: StockConEstado): void {
    this.router.navigate(['/home/DetailProduct', stock.idStock]);
  }

  RealizarPedido(): void {
    if (this.detallesCarrito.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
    this.router.navigate(['/home/datosCliente']);
  }
}