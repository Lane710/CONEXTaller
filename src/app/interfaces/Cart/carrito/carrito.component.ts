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
  }

  cargarCarrito(): void {
    console.log(`Intentando cargar carrito para el usuario: ${this.username}`);
    console.log(`Usuario actual: ${this.username}`); // Verifica el usuario actual
    this.carritoService.listarProductosDeUsuario(this.username).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          console.log(
            'Respuesta exitosa del backend (datos crudos):',
            response.data
          );

          const rawDetalles: RawDetalleCarritoProducto[] =
            response.data as RawDetalleCarritoProducto[];

          // Mapea y transforma los datos, asegurando que los campos monetarios sean 'string'
          this.detallesCarrito = rawDetalles.map(
            (item: RawDetalleCarritoProducto) => {
              return {
                ...item,
                // Convertimos a Decimal para asegurar la precisión y luego de vuelta a string
                precioUnitario: new Decimal(item.precioUnitario).toString(),
                subtotal: new Decimal(item.subtotal).toString(),
                producto: {
                  ...item.producto,
                  precio: new Decimal(item.producto.precio).toString(),
                },
              };
            }
          );

          console.log(
            'Productos del carrito (transformados a string para visualización):',
            this.detallesCarrito
          );
          this.calcularTotales(); // Calcula los totales después de cargar y transformar los datos
        } else {
          console.error(
            'Error al listar productos del carrito:',
            response.message
          );
          this.detallesCarrito = []; // Vacía el carrito en caso de error
          this.calcularTotales(); // Reinicia los totales
        }
      },
      error: (error) => {
        console.error('Error en la solicitud HTTP al listar productos:', error);
        this.detallesCarrito = []; // Vacía el carrito en caso de error de red
        this.calcularTotales(); // Reinicia los totales
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
    if (
      confirm(
        '¿Estás seguro de que quieres eliminar este producto del carrito?'
      )
    ) {
      this.carritoService
        .eliminarProductoDeCarrito(this.username, idDetalleCarrito)
        .subscribe({
          next: (response: ApiResponse) => {
            if (response.success) {
              console.log('Producto eliminado:', response.data);
              this.cargarCarrito(); // Recargar el carrito para actualizar la vista y los totales
            } else {
              console.error('Error al eliminar producto:', response.message);
            }
          },
          error: (err) => console.error('Error HTTP al eliminar:', err),
        });
    }
  }

  cambiarCantidad(idDetalleCarrito: number, operacion: 0 | 1): void {
    // Encuentra el ítem en la lista actual del carrito
    const item = this.detallesCarrito.find(
      (d) => d.idDetalleCarrito === idDetalleCarrito
    );

    // Si la operación es disminuir (0) y la cantidad actual es 1, no permitimos disminuir más
    // Esto previene que la cantidad llegue a 0 o menos desde el frontend,
    // aunque tu backend también debería manejarlo.
    if (operacion === 0 && item && item.cantidad <= 1) {
      alert(
        'La cantidad mínima de un producto es 1. Para quitarlo, usa el botón "Eliminar".'
      );
      return; // Detiene la ejecución si no se puede disminuir
    }

    this.carritoService
      .actualizarCantidadDetalle(idDetalleCarrito, operacion)
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            console.log('Cantidad actualizada:', response.data);
            this.cargarCarrito(); // Recargar el carrito para obtener los nuevos subtotales del backend
          } else {
            console.error('Error al actualizar cantidad:', response.message);
          }
        },
        error: (err) =>
          console.error('Error HTTP al actualizar cantidad:', err),
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
}
