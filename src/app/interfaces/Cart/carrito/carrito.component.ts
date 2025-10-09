import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Importa CurrencyPipe
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { ApiResponse } from '../../../models/api-response';
// Asegúrate de que estas rutas sean correctas para tus DTOs

import Decimal from 'decimal.js'; // Necesario para cálculos precisos
import { DetalleCarritoProducto } from '../../../DTOs/Cart/DetalleCarritoProducto';
import { RawDetalleCarritoProducto } from '../../../DTOs/Cart/ProductoEnCarrito';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule, // Añade CurrencyPipe a los imports para usarlo en el template
  ],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css',
})
export class CarritoComponent implements OnInit {
  username: string = localStorage.getItem('current_username') || '';

  detallesCarrito: DetalleCarritoProducto[] = []; // Propiedad para almacenar los detalles del carrito
  subtotalCarrito: string = '0.00'; // Inicializa como string
  totalCarrito: string = '0.00'; // Inicializa como string
  productosCuadricula: any[] = []; // Propiedad para almacenar los productos del carrusel
  
  @ViewChild('carouselContainer') carouselContainer!: ElementRef;
  constructor(
    private carritoService: CarritoService,
    private stockService: StockService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCarrito(); // Llama a cargarCarrito al inicializar el componente
    this.cargarProductosParaCuadricula();
    console.log(this.detallesCarrito.length)
  }
cargarCarrito(): void {
  console.log(`Intentando cargar carrito para el usuario: ${this.username}`);
  console.log(`Usuario actual: ${this.username}`);
  this.carritoService.listarProductosDeUsuario(this.username).subscribe({
    next: (response: ApiResponse) => {
      if (response.success) {
        console.log(
          'Respuesta exitosa del backend (datos crudos):',
          response.data
        );

        const rawDetalles: RawDetalleCarritoProducto[] =
          response.data as RawDetalleCarritoProducto[];

        // Mapea y transforma los datos
        this.detallesCarrito = rawDetalles.map(
          (item: RawDetalleCarritoProducto) => {
            return {
              ...item,
              precioUnitario: new Decimal(item.precioUnitario).toString(),
              subtotal: new Decimal(item.subtotal).toString(),
              producto: {
                ...item.producto,
                precio: Number(item.producto.precio),
              },
            };
          }
        );

        // --- ORDENA LA LISTA DIRECTAMENTE AQUÍ ---
        this.detallesCarrito.sort((a, b) => {
          const nombreA = a.producto.nombre.toLowerCase();
          const nombreB = b.producto.nombre.toLowerCase();
          if (nombreA < nombreB) return -1;
          if (nombreA > nombreB) return 1;
          return 0;
        });

        console.log(
          'Productos del carrito (ordenados alfabéticamente):',
          this.detallesCarrito
        );
        this.calcularTotales();
      } else {
        console.error(
          'Error al listar productos del carrito:',
          response.message
        );
        this.detallesCarrito = [];
        this.calcularTotales();
      }
    },
    error: (error) => {
      console.error('Error en la solicitud HTTP al listar productos:', error);
      this.detallesCarrito = [];
      this.calcularTotales();
    },
  });
}

  /**
   * Calcula el subtotal y el total del carrito usando Decimal.js para precisión.
   */
  calcularTotales(): void {
    let subtotalCalculado = new Decimal(0);

    this.detallesCarrito.forEach((item) => {
      // Suma los subtotales. item.subtotal es un string, lo convertimos a Decimal para la suma.
      subtotalCalculado = subtotalCalculado.plus(new Decimal(item.subtotal));
    });

    this.subtotalCarrito = subtotalCalculado.toString(); // Almacena el resultado como string
    this.totalCarrito = subtotalCalculado.toString(); // Asumiendo envío gratis por ahora, también como string
  }

  eliminarProducto(idDetalleCarrito: number): void {
    console.log(
      `Intentando eliminar producto con ID: ${idDetalleCarrito} del carrito del usuario: ${this.username}`
    );
    this.carritoService
      .eliminarProductoDeCarrito(this.username, idDetalleCarrito)
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.cargarCarrito(); // Recargar el carrito para actualizar la vista y los totales
          } else {
            console.error('Error al eliminar producto:', response.message);
          }
        },
        error: (err) => console.error('Error HTTP al eliminar:', err),
      });
  }

  cambiarCantidad(idDetalleCarrito: number, operacion: 0 | 1, stockDisponible: number): void {
    // Encuentra el ítem en la lista actual del carrito
    const item = this.detallesCarrito.find(
        (d) => d.idDetalleCarrito === idDetalleCarrito
    );

    if (!item) {
        console.error('El producto no se encontró en el carrito.');
        return;
    }

    // --- Lógica para sumar (operacion === 1) ---
    if (operacion === 1) {
        // Validación de stock: comprueba si la cantidad actual es menor que el stock
        if (item.cantidad >= stockDisponible) {
            return; // Detiene la ejecución si no hay suficiente stock
        }
    } 
    // --- Lógica para restar (operacion === 0) ---
    else if (operacion === 0 && item.cantidad <= 1) {
        alert('La cantidad mínima de un producto es 1. Para quitarlo, usa el botón "Eliminar".');
        return; // Detiene la ejecución si no se puede disminuir
    }

    // Si las validaciones pasan, llama al servicio para actualizar la cantidad
    this.carritoService
        .actualizarCantidadDetalle(idDetalleCarrito, operacion)
        .subscribe({
            next: (response: ApiResponse) => {
                if (response.success) {
                    console.log('Cantidad actualizada:', response.data);
                    this.cargarCarrito(); // Recargar el carrito
                } else {
                    console.error('Error al actualizar cantidad:', response.message);
                }
            },
            error: (err) => console.error('Error HTTP al actualizar cantidad:', err),
        });
}

  ///carrusel de productos que le pueden interesar
  cargarProductosParaCuadricula(): void {
    // La lógica de tu servicio para obtener los productos
    this.stockService.ProductoporCategoria(2, 6, 5).subscribe({
      next: (response) => {
        console.log('Productos para cuadrícula:', response);
        // Limita a un máximo de 8 productos
        this.productosCuadricula = response.data.slice(0, 8);
      },
      error: (error) => {
        console.error('Error al cargar productos para cuadrícula:', error);
        // Manejo de errores, por ejemplo, mostrar un mensaje al usuario
      },
    });
  }

  redirectToDetails(producto: any): void {
    console.log('Redirigiendo a detalles del producto:', producto);
    this.router.navigate(['/home/DetailProduct', producto.idStock]);
  }
  RealizarPedido(): void {
    // Aquí puedes implementar la lógica para redirigir al usuario a la página de pago
    console.log('Redirigiendo a la página de pago...');
    this.router.navigate(['/home/datosCliente']);
  }
}
