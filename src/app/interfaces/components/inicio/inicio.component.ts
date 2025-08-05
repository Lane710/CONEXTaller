// En tu ./inicio.component.ts

import {
  Component,
  OnInit,
  AfterViewInit,
  Renderer2,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { StockDTO } from '../../../DTOs/Produc/StockDTO'; // ¡Asegúrate de importar StockDTO!
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { AgregarDetalleCarritoRequest } from '../../../models/CartModel/AgregarDetalleCarritoRequest';
declare var bootstrap: any;

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent implements OnInit, AfterViewInit {
  ListadoProductos1: StockDTO[] = []; // Computadoras
  ListadoProductos2: StockDTO[] = []; // Accesorios
  ListadoProductos3: StockDTO[] = []; // Impresoras
  ListadoProductos4: StockDTO[] = []; // Otros
  currentIndex = 0;
  intervalId: any;
  usuarioValido: boolean = false;

  constructor(
    private router: Router,
    private stockPRoductService: StockService,
    private carritoService: CarritoService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.ProductosConSuCategoria();
  }

  ngAfterViewInit(): void {
    const carousels = this.el.nativeElement.querySelectorAll(
      '.carousel-inner.draggable'
    );

    carousels.forEach((carousel: HTMLElement) => {
      let isDragging = false;
      let startX: number;
      let scrollLeft: number;

      // Mouse events
      this.renderer.listen(carousel, 'mousedown', (e: MouseEvent) => {
        isDragging = true;
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        this.renderer.addClass(carousel, 'dragging');
      });

      this.renderer.listen(carousel, 'mouseleave', () => {
        isDragging = false;
        this.renderer.removeClass(carousel, 'dragging');
      });

      this.renderer.listen(carousel, 'mouseup', () => {
        isDragging = false;
        this.renderer.removeClass(carousel, 'dragging');
      });

      this.renderer.listen(carousel, 'mousemove', (e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2; // Multiplicador para velocidad de arrastre
        carousel.scrollLeft = scrollLeft - walk;
      });

      // Touch events
      this.renderer.listen(carousel, 'touchstart', (e: TouchEvent) => {
        isDragging = true;
        startX = e.touches[0].pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        this.renderer.addClass(carousel, 'dragging');
      });

      this.renderer.listen(carousel, 'touchend', () => {
        isDragging = false;
        this.renderer.removeClass(carousel, 'dragging');
      });

      this.renderer.listen(carousel, 'touchmove', (e: TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
      });
    });
  }

  ProductosConSuCategoria() {
    this.stockPRoductService
      .ProductoporCategoria(2, 3, 5)
      .subscribe((response) => {
        // Mapea los productos para añadir la propiedad anadidoAlCarrito
        this.ListadoProductos1 = response.data.map((item: StockDTO) => ({ // <--- Aquí el cambio
          ...item,
          anadidoAlCarrito: false, // Inicializa en false
        }));
      });
    this.stockPRoductService
      .ProductoporCategoria(1, 6, 0)
      .subscribe((response) => {
        this.ListadoProductos2 = response.data.map((item: StockDTO) => ({ // <--- Aquí el cambio
          ...item,
          anadidoAlCarrito: false,
        }));
      });
    this.stockPRoductService
      .ProductoporCategoria(7, 8, 0)
      .subscribe((response) => {
        this.ListadoProductos3 = response.data.map((item: StockDTO) => ({ // <--- Aquí el cambio
          ...item,
          anadidoAlCarrito: false,
        }));
      });
    this.stockPRoductService
      .ProductoporCategoria(4, 9, 0)
      .subscribe((response) => {
        this.ListadoProductos4 = response.data.map((item: StockDTO) => ({ // <--- Aquí el cambio
          ...item,
          anadidoAlCarrito: false,
        }));
      });
  }

  paginateProducts(items: StockDTO[], itemsPerPage: number): StockDTO[][] {
    const result: StockDTO[][] = [];
    if (!items || items.length === 0) {
      return result;
    }
    for (let i = 0; i < items.length; i += itemsPerPage) {
      result.push(items.slice(i, i + itemsPerPage));
    }
    return result;
  }

  AddProductCarrito(stockItem: StockDTO) {
    const usuarioId = localStorage.getItem('current_username');

    if(usuarioId==null || usuarioId==undefined || usuarioId==''){
     const modalElement = document.getElementById('modalSesionRequerida');

        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            // Opcional: Manejar los botones dentro de esta misma función
            const btnIrLogin = document.getElementById('btnIrLogin');
            if (btnIrLogin) {
                btnIrLogin.onclick = () => {
                    modal.hide();
                    this.router.navigate(['/login']); // Asume que tienes el Router inyectado
                };
            }

            const btnOkModal = document.getElementById('btnOkModal');
            if (btnOkModal) {
                btnOkModal.onclick = () => {
                    modal.hide();
                };
            }
        }
    }else{

    
    const request: AgregarDetalleCarritoRequest = {
      producto: {
        idProducto: stockItem.producto.idProducto,
      },
      cantidad: 1,
      precioUnitario: parseFloat(stockItem.producto.precio),
    };

    this.carritoService.agregarProductoACarrito(usuarioId, request).subscribe({
      next: (response) => {
        console.log('Producto agregado al carrito con éxito:');
        stockItem.anadidoAlCarrito = true;
      },
      error: (error) => {
        console.error('Error al agregar producto al carrito:', error);
        alert('Hubo un problema al añadir el producto al carrito.');
      },
    });
  }
  }

  Details(prodcut: StockDTO) {
    this.router.navigate(['/home/DetailProduct', prodcut.idStock]);
    console.log('Detalles del producto');
  }
}
