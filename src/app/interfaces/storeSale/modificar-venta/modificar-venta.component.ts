import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { VentasService } from '../../../services/ventasTienda/ventas.service';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { stock } from '../../../models/ProductoStockModel/stock';
import { detalleVenta } from '../../../models/Ventas/detalleVenta';
import { ClientesService } from '../../../services/ventasTienda/clientes.service';
import { ventas } from '../../../models/Ventas/ventas';
import { DetalleVentasService } from '../../../services/ventasTienda/detalle-ventas.service';
import { forkJoin, of, Observable } from 'rxjs'; // Importa Observable para tipado
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { clientes } from '../../../models/Ventas/clientes'; // Importar el modelo de clientes
import { ApiResponse } from '../../../models/api-response'; // Importar el modelo de ApiResponse

declare var bootstrap: any;

@Component({
  selector: 'app-modificar-venta',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './modificar-venta.component.html',
  styleUrl: './modificar-venta.component.css',
})
export class ModificarVentaComponent implements OnInit {
  constructor(
    private productosConStock: StockService,
    private ventasS: VentasService,
    private cdr: ChangeDetectorRef,
    private clienteS: ClientesService,
    private detalleVentaS: DetalleVentasService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 1. Obtiene el ID de la venta de la URL
    this.route.paramMap.subscribe((params) => {
      const idVenta = params.get('idVenta');
      console.log('ID de venta obtenido:', idVenta);
      if (idVenta) {
        // 2. Si hay un ID, carga la venta y sus detalles
        //  this.cargarVentaExistente(idVenta);
      }
    });

    // 3. Carga el listado de productos disponibles
    this.listadoProductos();
  } // --- Variables de estado del componente de modificación ---

  ventaExistente: ventas | undefined;
  detalleVentasExistente: detalleVenta[] = [];
  detalleVentasOriginal: detalleVenta[] = []; // Se usa para la comparación // ⭐ NUEVAS LISTAS para almacenar los cambios

  detallesToAdd: detalleVenta[] = [];
  detallesToModify: detalleVenta[] = [];
  detallesToDelete: detalleVenta[] = [];

  idVenta: string | null = null;
  nombreCliente: string = '';
  apellidosCliente: string = '';
  celularCliente: string = '';
  emailCliente: string = ''; // --- Variables de la lógica de venta/modificación ---

  usuarioTrabajador: string = localStorage.getItem('current_username') || '';
  products: stock[] = [];
  filteredProducts: stock[] = [];
  paginatedProducts: stock[] = [];
  cantidadesEnVenta: number[] = [];
  filtroTermino: string = ''; // Variables de estado para el modal

  mostrarModalStock: boolean = false;
  nombreProductoModal: string = '';
  stockMaximoModal: number = 0; // Variables de paginación

  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 0; /** // --- Métodos de la funcionalidad principal ---
* Carga los datos de la venta existente y los detalles de venta.
* @param id El ID de la venta.

  cargarVentaExistente(id: string) {
 this.idVenta = id;
 this.ventasS.findById(id).subscribe({
   next: (response) => {
  console.log('Venta encontrada:', response);
  this.ventaExistente = response.data;
  if (this.ventaExistente) {
    this.cargarDetallesDeVenta(this.ventaExistente.idVenta || 0);
    if (this.ventaExistente.cliente) {
   this.nombreCliente = this.ventaExistente.cliente.nombre;
   this.apellidosCliente = this.ventaExistente.cliente.apPaterno || '';
   this.celularCliente = this.ventaExistente.cliente.telefono || '';
   this.emailCliente = this.ventaExistente.cliente.email || '';
    }
  }
   },
   error: (error) => {
  console.error('Error al obtener la venta:', error);
   },
 });
  }*/
  /**
   * Carga los detalles de la venta a partir del ID de la venta.
   * @param idVenta El ID de la venta para buscar sus detalles.
   */

  cargarDetallesDeVenta(idVenta: number) {
    this.detalleVentaS.listarPorIdVenta(idVenta).subscribe({
      next: (response) => {
        this.detalleVentasExistente = response.data;
        // ⭐ Clave: Guarda una copia de los detalles de venta originales para comparar
        this.detalleVentasOriginal = JSON.parse(JSON.stringify(response.data));
        console.log(
          'Detalles de venta existentes (iniciales):',
          this.detalleVentasExistente
        );
      },
      error: (error) => {
        console.error('Error al obtener los detalles de la venta:', error);
      },
    });
  }
  /**
   * Método principal que orquesta la actualización de la venta.
   */

  actualizarVenta() {
    if (!this.ventaExistente || !this.idVenta) {
      console.error('No hay una venta para actualizar.');
      return;
    }

    // 1. Sincroniza las listas de cambios antes de iniciar las peticiones
    this.sincronizarListasCambios();

    // 2. Ejecuta todas las peticiones de modificación
    this.ejecutarPeticionesDeModificacion();
  }
  /**
   * Orquesta las peticiones al backend en el orden correcto.
   */

  private ejecutarPeticionesDeModificacion() {
    const peticionesDetalles: Observable<any>[] = [];

    // Las peticiones se hacen en paralelo para los detalles
    // el backend debe manejar el stock de forma atómica en cada endpoint.
    this.detallesToDelete.forEach((detalle) => {
      if (detalle.idDetalleVenta) {
        peticionesDetalles.push(
          this.detalleVentaS.delete(detalle.idDetalleVenta)
        );
      }
    });

    this.detallesToModify.forEach((detalle) => {
      if (detalle.idDetalleVenta) {
        peticionesDetalles.push(this.detalleVentaS.update(detalle));
      }
    });

    this.detallesToAdd.forEach((detalle) => {
      const nuevoDetalle = { ...detalle, venta: this.ventaExistente as ventas };
      peticionesDetalles.push(this.detalleVentaS.save(nuevoDetalle));
    });

    // Si hay peticiones de detalles, las ejecutamos y luego actualizamos la venta principal
    if (peticionesDetalles.length > 0) {
      forkJoin(peticionesDetalles).subscribe({
        next: () => {
          console.log('✅ Detalles de venta actualizados correctamente.');
          this.actualizarClienteYVentaPrincipal();
        },
        error: (error) => {
          console.error('❌ Error al procesar los detalles de venta:', error); // Maneja el error, tal vez mostrando un mensaje al usuario
        },
      });
    } else {
      // Si no hay cambios en los detalles, pasamos directamente a actualizar la venta
      console.log(
        '➡️ No hay cambios en los detalles de venta. Pasando al siguiente paso.'
      );
      this.actualizarClienteYVentaPrincipal();
    }
  }
  /**
   * Actualiza la información del cliente y la venta principal.
   */

  private actualizarClienteYVentaPrincipal() {
    const peticionesFinales: Observable<any>[] = [];

    // Actualiza el cliente si hay cambios
    const clienteActualizado = {
      ...this.ventaExistente?.cliente,
      nombre: this.nombreCliente,
      apPaterno: this.apellidosCliente,
      telefono: this.celularCliente,
      email: this.emailCliente,
    } as clientes;

    

    if (this.ventaExistente) {
      const ventaActualizada: ventas = {
        ...this.ventaExistente,
        total: this.calcularTotal(),
      };
      console.log('➡️ Actualizando la venta principal...');
      peticionesFinales.push(this.ventasS.update(ventaActualizada));
    }

    forkJoin(peticionesFinales).subscribe({
      next: () => {
        console.log(
          '✅ Cliente y venta principal actualizados correctamente. Proceso finalizado.'
        );
        this.cerrarModalYRedirigir();
      },
      error: (error) => {
        console.error(
          '❌ Error al actualizar el cliente o la venta principal:',
          error
        );
      },
    });
  }
  /**
   * Añade un producto del listado a la lista de detalles de la venta existente (localmente).
   * @param producto El producto a añadir.
   * @param cantidad La cantidad a añadir.
   */

  anadirVentaTemporal(producto: stock, cantidad: number) {
    const productoExistente = this.detalleVentasExistente.find(
      (item) => item.producto.idProducto === producto.producto.idProducto
    );

    const cantidadTotalVenta = (productoExistente?.cantidad || 0) + cantidad;

    const productoEnStock = this.products.find(
      (p) => p.idStock === producto.idStock
    );

    const globalIndex = this.products.findIndex(
      (p) => p.idStock === producto.idStock
    );

    if (productoEnStock && cantidadTotalVenta > productoEnStock.cantidad) {
      if (globalIndex !== -1) {
        this.cantidadesEnVenta[globalIndex] = 1;
        this.aplicarFiltro();
      }
      this.mostrarModal(
        productoEnStock.producto.nombre+'',
        productoEnStock.cantidad
      );
      return;
    }

    if (productoExistente) {
      productoExistente.cantidad = cantidadTotalVenta;
      productoExistente.subtotal =
        cantidadTotalVenta * productoExistente.precioUnitario;
    } else {
      this.detalleVentasExistente.push({
        venta: this.ventaExistente as ventas,
        producto: producto.producto,
        cantidad: cantidad,
        precioUnitario: producto.producto.precio||0,
        subtotal: cantidad * (producto.producto.precio||0),
        precioBase: producto.producto.precioCompra||0,
      });
    }

    if (globalIndex !== -1) {
      this.cantidadesEnVenta[globalIndex] = 1;
    }

    this.aplicarFiltro();
    this.sincronizarListasCambios();
    console.log(
      'Detalles de venta actualizados (después de añadir):',
      this.detalleVentasExistente
    );
  }
  /**
   * Elimina un detalle de venta de la lista temporal.
   * @param index El índice del detalle de venta a eliminar.
   */

  eliminarDetalleVenta(index: number) {
    const detalleAEliminar = this.detalleVentasExistente[index];
    if (detalleAEliminar) {
      this.detalleVentasExistente.splice(index, 1);
      this.sincronizarListasCambios();
      console.log(
        'Detalle de venta eliminado de la lista temporal. Estado actual:',
        this.detalleVentasExistente
      );
      this.cdr.detectChanges();
    }
  }
  /**
   * Método para sincronizar las listas de cambios.
   */

  sincronizarListasCambios() {
    this.detallesToAdd = [];
    this.detallesToModify = [];
    this.detallesToDelete = [];

    // Encuentra los detalles eliminados
    this.detalleVentasOriginal.forEach((original) => {
      const existe = this.detalleVentasExistente.find(
        (existente) => existente.idDetalleVenta === original.idDetalleVenta
      );
      if (!existe) {
        this.detallesToDelete.push(original);
      }
    });

    // Encuentra los detalles nuevos y modificados
    this.detalleVentasExistente.forEach((existente) => {
      const original = this.detalleVentasOriginal.find(
        (orig) => orig.idDetalleVenta === existente.idDetalleVenta
      ); // Si no existe un original, es un nuevo detalle a agregar

      if (!original) {
        this.detallesToAdd.push(existente);
      } else if (existente.cantidad !== original.cantidad) {
        // Si la cantidad es diferente, es un detalle modificado
        this.detallesToModify.push(existente);
      }
    });

    console.log('--- Lógica de sincronización ---');
    console.log('Cambios detectados - Añadir:', this.detallesToAdd);
    console.log('Cambios detectados - Modificar:', this.detallesToModify);
    console.log('Cambios detectados - Eliminar:', this.detallesToDelete);
    console.log('-------------------------------');
  } // listado de productos desde stock

  listadoProductos() {
    this.productosConStock.listadoProducStock().subscribe({
      next: (response) => {
        this.products = response.data;
        this.aplicarFiltro();
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      },
    });
  } // Función para mostrar el modal con los datos del producto

  mostrarModal(nombreProducto: string, stockMaximo: number) {
    this.nombreProductoModal = nombreProducto;
    this.stockMaximoModal = stockMaximo;
    this.mostrarModalStock = true;
  } // Función para ocultar el modal

  ocultarModal() {
    this.mostrarModalStock = false;
  }

  cerrarModalYRedirigir() {
    const modalElement = document.getElementById('confirmModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.router.navigate(['/home/listadoVentasStore']);
  }

  aplicarFiltro() {
    if (!this.filtroTermino) {
      this.filteredProducts = this.products;
    } else {
      const searchTerm = this.filtroTermino.toLowerCase();
      this.filteredProducts = this.products.filter((item) =>
        item.producto?.nombre?.toLowerCase().includes(searchTerm)
      );
    }
    this.cantidadesEnVenta = this.filteredProducts.map(() => 1);
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

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

  sumarRestar(index: number, num: number) {
    const globalIndex = (this.currentPage - 1) * this.pageSize + index;
    if (num === 1) {
      this.cantidadesEnVenta[globalIndex]++;
    } else if (this.cantidadesEnVenta[globalIndex] > 1) {
      this.cantidadesEnVenta[globalIndex]--;
    }
    this.cdr.detectChanges();
  }

  actualizarCantidadManual(index: number, event: any) {
    const globalIndex = (this.currentPage - 1) * this.pageSize + index;
    let newQuantity = parseInt(event.target.value, 10);
    const productInStock = this.products[globalIndex];

    newQuantity = Math.round(newQuantity);

    if (isNaN(newQuantity) || newQuantity < 1) {
      this.cantidadesEnVenta[globalIndex] = 1;
      return;
    }

    if (productInStock && newQuantity > productInStock.cantidad) {
      console.error('No hay suficiente stock.');
      this.cantidadesEnVenta[globalIndex] = productInStock.cantidad;
      this.mostrarModal(
        productInStock.producto.nombre+'',
        productInStock.cantidad
      );
      return;
    }

    this.cantidadesEnVenta[globalIndex] = newQuantity;
    this.cdr.detectChanges();
  }

  calcularSubtotal(): number {
    return this.detalleVentasExistente.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    );
  }

  calcularTotal(): number {
    return this.calcularSubtotal();
  }
}
