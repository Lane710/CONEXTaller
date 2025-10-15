import { 
  Component, 
  OnInit, 
  AfterViewInit, 
  ViewChild, 
  ElementRef 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { ApiResponse } from '../../../models/api-response';
import Decimal from 'decimal.js';
import { DetalleCarrito } from '../../../models/CartModel/DetalleCarrito';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { Router } from '@angular/router';
import { StockDTO } from '../../../DTOs/dtosBD/StockDTO';

// Import Bootstrap JS types for TypeScript recognition
declare var bootstrap: any;

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css',
})
export class CarritoComponent implements OnInit, AfterViewInit {
  username: string = localStorage.getItem('current_username') || '';
  detallesCarrito: DetalleCarrito[] = [];
  detallesCarritoOrdenados: DetalleCarrito[] = [];
  subtotalCarrito: string = '0.00';
  totalCarrito: string = '0.00';
  productosCuadricula: StockDTO[] = [];

  // --- Referencias de Modal para Eliminar (NUEVO) ---
  @ViewChild('confirmarEliminarModal') confirmarEliminarModalRef!: ElementRef;
  private confirmarEliminarModalInstance: any;

  // Propiedad para almacenar el producto a eliminar
  productoAEliminar: { idDetalleCarrito: number; nombre: string } | null = null;

  constructor(
    private carritoService: CarritoService,
    private stockService: StockService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.username) {
      console.warn('No se encontró usuario en localStorage');
      return;
    }
    this.cargarCarrito();
    this.cargarProductosParaCuadricula();
  }

  // Inicializar las instancias de Bootstrap Modal
  ngAfterViewInit(): void {
    if (this.confirmarEliminarModalRef) {
      this.confirmarEliminarModalInstance = new bootstrap.Modal(
        this.confirmarEliminarModalRef.nativeElement
      );
    }
  }

  // --- Métodos para el Modal de Eliminación (NUEVO) ---

  /**
   * @description Abre el modal de confirmación para eliminar producto
   */
  abrirModalConfirmarEliminar(item: DetalleCarrito): void {
    this.productoAEliminar = {
      idDetalleCarrito: item.idDetalleCarrito || 0,
      nombre: item.stock.producto.nombre
    };
    
    if (this.confirmarEliminarModalInstance) {
      this.confirmarEliminarModalInstance.show();
    }
  }

  /**
   * @description Cierra el modal de confirmación
   */
  cerrarModalConfirmarEliminar(): void {
    if (this.confirmarEliminarModalInstance) {
      this.confirmarEliminarModalInstance.hide();
    }
    this.productoAEliminar = null;
  }

  /**
   * @description Confirma la eliminación del producto
   */
  confirmarEliminacion(): void {
    if (!this.productoAEliminar) {
      console.error('No hay producto seleccionado para eliminar');
      return;
    }

    this.carritoService.eliminarProductoDeCarrito(
      this.username, 
      this.productoAEliminar.idDetalleCarrito
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          console.log('Producto eliminado correctamente del carrito');
          this.cerrarModalConfirmarEliminar();
          this.cargarCarrito(); // Recargar el carrito
        }
      },
      error: (err) => {
        console.error('Error al eliminar producto:', err);
        alert('Error al eliminar el producto del carrito');
        this.cerrarModalConfirmarEliminar();
      },
    });
  }

  // --- Mantén tus métodos existentes ---

  cargarCarrito(): void {
    this.carritoService.listarProductosDeUsuario(this.username).subscribe({
      next: (response: ApiResponse) => {
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

  cargarProductosParaCuadricula(): void {
    this.stockService.ProductoporCategoria(2, 6, 5).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.productosCuadricula = res.data.slice(0, 8);
        }
      },
      error: (err) => console.error('Error al cargar productos para cuadrícula:', err),
    });
  }

  redirectToDetails(stock: StockDTO): void {
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