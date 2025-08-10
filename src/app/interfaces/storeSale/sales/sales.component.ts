// sales.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { VentasService } from '../../../services/ventasTienda/ventas.service';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { stock } from '../../../models/ProductoStockModel/stock';
import { detalleVenta } from '../../../models/Ventas/detalleVenta';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../../services/ventasTienda/clientes.service';
import { clientes } from '../../../models/Ventas/clientes';
import { ventas } from '../../../models/Ventas/ventas';
import { DetalleVentasService } from '../../../services/ventasTienda/detalle-ventas.service';
import { forkJoin } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

declare var bootstrap: any; // Declaramos la variable 'bootstrap' para que TypeScript la reconozca

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [NgFor, CurrencyPipe, NgIf, FormsModule, RouterLink],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
})
export class SalesComponent implements OnInit {
  constructor(
    private productosConStock: StockService,
    private ventasS: VentasService,
    private cdr: ChangeDetectorRef,
    private cliente: ClientesService,
    private detalleVentaS: DetalleVentasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listadoProductos();
  }
  usuarioTrabajador: string = localStorage.getItem('current_username') || ''; // Asigna el usuario trabajador aquí
  // Variables globales
  products: stock[] = [];
  filteredProducts: stock[] = [];
  paginatedProducts: stock[] = [];
  cantidadesEnVenta: number[] = [];
  productosPorVender: detalleVenta[] = [];
  filtroTermino: string = '';
  clienteVenta: clientes | undefined;

  // 👉 Variables de estado para el modal
  mostrarModalStock: boolean = false;
  nombreProductoModal: string = '';
  stockMaximoModal: number = 0;

  // Variables de paginación
  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 0;
  // listado de productos desde stock
  listadoProductos() {
    this.productosConStock.listadoProducStock().subscribe({
      next: (response) => {
        this.products = response.data;
        console.log('Productos con stock:', this.products);
        this.aplicarFiltro();
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      },
    });
  }

  // 👉 Función para mostrar el modal con los datos del producto
  mostrarModal(nombreProducto: string, stockMaximo: number) {
    this.nombreProductoModal = nombreProducto;
    this.stockMaximoModal = stockMaximo;
    this.mostrarModalStock = true;
  }

  // 👉 Función para ocultar el modal
  ocultarModal() {
    this.mostrarModalStock = false;
  }

  realizarVenta() {
    let nombreClient = document.getElementById(
      'clienteNombre'
    ) as HTMLInputElement;
    let apellidosClient = document.getElementById(
      'apellidosClientes'
    ) as HTMLInputElement;
    let celularClient = document.getElementById(
      'numeroCliente'
    ) as HTMLInputElement;
    let emailClient = document.getElementById('emailCliente') as HTMLInputElement;

    // 1. Preparamos los datos del cliente
    this.clienteVenta = {
      nombre: nombreClient.value,
      apPaterno: apellidosClient.value,
      email: emailClient.value,
      telefono: celularClient.value,
    };

    // 2. Guardamos el cliente primero
    this.cliente.save(this.clienteVenta).subscribe({
      next: (responseCliente) => {
        console.log('Cliente guardado:', responseCliente);

        // 3. Preparamos los datos de la venta usando el cliente guardado
        const ventaNueva = {
          cliente: responseCliente.data,
          total: this.calcularTotal(),
          usuarioTrabajador: this.usuarioTrabajador,
        };

        // 4. Guardamos la venta para obtener su ID
        this.ventasS.save(ventaNueva).subscribe({
          next: (responseVenta) => {
            console.log('Venta realizada:', responseVenta);

            // 5. Verificamos si hay productos para vender
            if (this.productosPorVender.length > 0) {
              console.log(
                'Hay productos para vender:',
                this.productosPorVender
              );

              const detalleVentaSaves = this.productosPorVender.map((producto) => {
                producto.venta = responseVenta.data;
                return this.detalleVentaS.save(producto);
              });

              // 6. Usamos forkJoin para esperar a que todos los detalles se guarden
              forkJoin(detalleVentaSaves).subscribe({
                next: (detalleResponses) => {
                  console.log(
                    'Todos los detalles de venta guardados:',
                    detalleResponses
                  );
                  // Llama al método para cerrar el modal
                  this.cerrarModalYRedirigir();
                },
                error: (error) => {
                  console.error(
                    'Error al guardar uno o varios detalles de venta:',
                    error
                  );
                },
              });
            } else {
              console.log('No hay productos para vender.');
              // Llama al método para cerrar el modal y redirigir
              this.cerrarModalYRedirigir();
            }
          },
          error: (errorVenta) => {
            console.error('Error al realizar la venta:', errorVenta);
          },
        });
      },
      error: (errorCliente) => {
        console.error('Error al guardar el cliente:', errorCliente);
      },
    });
  }

  // 👉 NUEVO MÉTODO PARA CERRAR EL MODAL Y REDIRIGIR
  cerrarModalYRedirigir() {
    // Obtenemos una referencia al elemento del modal
    const modalElement = document.getElementById('confirmModal');
    if (modalElement) {
      // Creamos una instancia de Modal de Bootstrap
      const modal = bootstrap.Modal.getInstance(modalElement);
      // Cerramos el modal
      if (modal) {
        modal.hide();
      }
    }
    // Redirigimos a la página de inicio o a donde sea necesario
    this.router.navigate(['/home/listadoVentasStore']);
  }

  // Resto de métodos...

  // Método para aplicar el filtro y actualizar la paginación
  aplicarFiltro() {
    if (!this.filtroTermino) {
      this.filteredProducts = this.products;
    } else {
      const searchTerm = this.filtroTermino.toLowerCase();
      this.filteredProducts = this.products.filter((item) =>
        item.producto.nombre.toLowerCase().includes(searchTerm)
      );
    }
    this.cantidadesEnVenta = this.filteredProducts.map(() => 1);
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    this.updatePaginatedProducts();
  }

  // Método para actualizar la lista de productos de la página actual
  updatePaginatedProducts() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  // Método para cambiar la página
  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProducts();
    }
  }

  previousPage() {
    this.onPageChange(this.currentPage - 1);
  }

  nextPage() {
    this.onPageChange(this.currentPage + 1);
  }

  /**
   * Método para sumar y restar la cantidad de un producto específico.
   * La cantidad se modifica en el array 'cantidadesEnVenta' usando el índice del producto.
   * @param index El índice del producto en la lista.
   * @param num El valor a sumar o restar (1 o -1).
   */
  sumarRestar(index: number, num: number) {
    // Obtenemos el índice global del producto
    const globalIndex = (this.currentPage - 1) * this.pageSize + index;
    if (num === 1) {
      this.cantidadesEnVenta[globalIndex]++;
    } else if (num === -1 && this.cantidadesEnVenta[globalIndex] > 1) {
      this.cantidadesEnVenta[globalIndex]--;
    }
    // Forzamos la detección de cambios para asegurarnos de que la vista se actualice
    this.cdr.detectChanges();
  }

  /**
   * Método para actualizar manualmente la cantidad de un producto desde el input.
   * @param index El índice del producto en la página actual.
   * @param event El evento del DOM con el valor del input.
   */
  actualizarCantidadManual(index: number, event: any) {
    const globalIndex = (this.currentPage - 1) * this.pageSize + index;
    let newQuantity = parseInt(event.target.value, 10);
    const productInStock = this.products[globalIndex];

    // Redondeamos el número para asegurar que sea un entero.
    newQuantity = Math.round(newQuantity);

    // Validamos que el valor sea un número y que no sea menor a 1
    if (isNaN(newQuantity) || newQuantity < 1) {
      this.cantidadesEnVenta[globalIndex] = 1;
      return;
    }

    // Validamos que la nueva cantidad no exceda el stock disponible
    if (productInStock && newQuantity > productInStock.cantidad) {
      console.error(
        'No hay suficiente stock para este producto. Stock disponible: ' +
          productInStock.cantidad
      );
      this.cantidadesEnVenta[globalIndex] = productInStock.cantidad;
      // 👉 Llamamos a la función para mostrar el modal aquí
      this.mostrarModal(
        productInStock.producto.nombre,
        productInStock.cantidad
      );
      return;
    }

    // Si la validación es exitosa, actualizamos la cantidad
    this.cantidadesEnVenta[globalIndex] = newQuantity;
    // Forzamos la detección de cambios para asegurarnos de que la vista se actualice
    this.cdr.detectChanges();
  }

  anadirVentaTemporal(producto: stock, cantidad: number) {
    // Busca si el producto ya existe en la lista de ventas temporal
    const productoExistente = this.productosPorVender.find(
      (item) => item.stock.idStock === producto.idStock
    );

    // Variable para almacenar la cantidad total que se quiere vender
    let cantidadTotalVenta = cantidad;

    // Si el producto ya está en la lista de ventas, calculamos la nueva cantidad total
    if (productoExistente) {
      cantidadTotalVenta = productoExistente.cantidad + cantidad;
    }

    // Encuentra el producto completo en tu lista global `this.products`
    const productoEnStock = this.products.find(
      (p) => p.idStock === producto.idStock
    );

    // Encuentra el índice global del producto para resetear la cantidad en la tabla
    const globalIndex = this.products.findIndex(
      (p) => p.idStock === producto.idStock
    );

    // 👉 Validación clave: Compara la cantidad total de la venta con el stock real
    if (productoEnStock && cantidadTotalVenta > productoEnStock.cantidad) {
      // Reseteamos la cantidad en el array de cantidades y volvemos a aplicar el filtro
      if (globalIndex !== -1) {
        this.cantidadesEnVenta[globalIndex] = 1;
        this.aplicarFiltro();
      }
      // 👉 Llamamos a la función para mostrar el modal aquí
      this.mostrarModal(
        productoEnStock.producto.nombre,
        productoEnStock.cantidad
      );
      return; // Detenemos la ejecución aquí
    }

    // Si la validación es exitosa, procedemos a añadir o actualizar el producto
    if (productoExistente) {
      productoExistente.cantidad = cantidadTotalVenta;
    } else {
      // Si es un producto nuevo, lo añade a la lista
      this.productosPorVender.push({
        stock: producto,
        cantidad: cantidadTotalVenta,
        precioUnitario: producto.producto.precio,
        subtotal: cantidadTotalVenta * producto.producto.precio,
      });
    }

    // Reseteamos la cantidad en el array de cantidades y volvemos a aplicar el filtro
    if (globalIndex !== -1) {
      this.cantidadesEnVenta[globalIndex] = 1;
    }

    // Llamamos a aplicarFiltro() para forzar un re-render de la lista y resetear el input
    this.aplicarFiltro();

    console.log('Productos por vender:', this.productosPorVender);
  }

  /**
   * Elimina un producto de la lista temporal de venta.
   * @param index El índice del producto a eliminar.
   */
  eliminarVentaTemporal(index: number) {
    this.productosPorVender.splice(index, 1);
  }

  /**
   * Calcula el subtotal de todos los productos en la lista temporal.
   * @returns El subtotal de la venta.
   */
  calcularSubtotal(): number {
    return this.productosPorVender.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    );
  }

  /**
   * Calcula el 12% de IVA del subtotal.
   * @returns El monto del IVA.
   */
  //descuento(): number {
    //return this.calcularSubtotal();
  //}

  /**
   * Calcula el total de la venta (subtotal + IVA).
   * @returns El total de la venta.
   */
  calcularTotal(): number {
    return this.calcularSubtotal();
  }
}