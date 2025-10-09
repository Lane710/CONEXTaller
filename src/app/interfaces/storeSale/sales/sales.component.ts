import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { VentasService } from '../../../services/ventasTienda/ventas.service';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { stock } from '../../../models/ProductoStockModel/stock';
import { detalleVenta } from '../../../models/Ventas/detalleVenta';
import { FormsModule, NgForm } from '@angular/forms';
import { ClientesService } from '../../../services/ventasTienda/clientes.service';
import { clientes } from '../../../models/Ventas/clientes';

import { DetalleVentasService } from '../../../services/ventasTienda/detalle-ventas.service';
import { catchError, concatMap, forkJoin, of, throwError } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';


import { ProductosService } from '../../../services/ProductosServis/productos.service';
import { FormaPagoService } from '../../../services/PedidosEnviosDetalles/forma-pago.service';
import { forma_pago } from '../../../models/PedidosEnviosDetalles/forma_pago';
import { categorias } from '../../../models/ProductoStockModel/categorias';
import { productos } from '../../../models/ProductoStockModel/productos';
import { ventas } from '../../../models/Ventas/ventas';

declare var bootstrap: any;

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
    private clienteS: ClientesService,
    private detalleVentaS: DetalleVentasService,
    private router: Router,
    private productosService: ProductosService,
    private formaPagoS: FormaPagoService
  ) {}

  ngOnInit(): void {
    this.listadoProductos();
    this.buscadorCliente(); // Cargar todos los clientes al iniciar
  }

  usuarioTrabajador: string = localStorage.getItem('current_username') || '';
  products: stock[] = [];
  filteredProducts: stock[] = [];
  paginatedProducts: stock[] = [];
  cantidadesEnVenta: number[] = [];
  productosPorVender: detalleVenta[] = [];
  filtroTermino: string = '';
  clienteVenta: clientes = { ci:'0',nombre: '' };

  // Propiedades para el buscador y autocompletado de cliente
  clienteNombreBuscador: string = '';
  clientesFiltrados: clientes[] = [];
  clienteSeleccionado: clientes ={ci:'0',nombre:''};
  clienteExistes: clientes[] = [];

  mostrarModalStock: boolean = false;
  nombreProductoModal: string = '';
  stockMaximoModal: number = 0;

  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 0;

  filterCategory: string = 'Todos';
  categorias: categorias[] = [];
  metodoDePagoSeleccionado: string = 'efectivo';
  codigoMetodoPago: number = 3333;
  //variable para el descuento
  
  descuento: number = 0.0;
  notaVenta:string='';
isCiDisabled: boolean = false; // <-- AGREGAR ESTA PROPIEDAD
  formaPago: forma_pago = {
    idFormaPago: 3333,
    nombre: 'Efectivo',
    descripcion: 'Pago a través de la plataforma',
    estado: 'Activo',
  };

  listadoProductos() {
    this.productosConStock.listadoProducStock().subscribe({
      next: (response) => {
        this.products = response.data;
        console.log('Productos con stock:', this.products);
        this.loadCategorias();
        this.aplicarFiltro();
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      },
    });
  }

  loadCategorias(): void {
    this.productosService.getCategorias().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categorias = response.data as categorias[];
          console.log(this.categorias);
        } else {
          this.showModalMessage(
            'Error',
            'No se pudieron cargar las categorías: ' + response.message,
            false
          );
        }
      },
      error: (err: HttpErrorResponse) => {
        this.showModalMessage(
          'Error',
          'Error de conexión al cargar categorías: ' +
            (err.message || 'Error desconocido'),
          false
        );
      },
    });
  }
  showModalMessage(arg0: string, arg1: string, arg2: boolean) {
    throw new Error('Method not implemented.');
  }

  aplicarFiltro(): void {
    let tempProducts = [...this.products];

    tempProducts = tempProducts.filter((item) => item?.producto);

    if (this.filtroTermino) {
      const term = this.filtroTermino.toLowerCase();
      tempProducts = tempProducts.filter((item) =>
        item.producto?.nombre?.toLowerCase().includes(term)
      );
    }

    if (this.filterCategory && this.filterCategory !== 'Todos') {
      const categoryTerm = this.filterCategory.toLowerCase();
      tempProducts = tempProducts.filter(
        (item) =>
          item.producto?.categoria?.nombre?.toLowerCase() === categoryTerm
      );
    }

    this.filteredProducts = tempProducts;
    this.cantidadesEnVenta = this.filteredProducts.map(() => 1);
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    this.updatePaginatedProducts();
  }

  mostrarModal(nombreProducto: string, stockMaximo: number) {
    this.nombreProductoModal = nombreProducto;
    this.stockMaximoModal = stockMaximo;
    this.mostrarModalStock = true;
  }

  ocultarModal() {
    this.mostrarModalStock = false;
  }

  realizarVenta() {
  let clienteParaGuardar: clientes;
  const nombreClient = (document.getElementById('clienteNombre') as HTMLInputElement).value;
  const apellidosClient = (document.getElementById('apellidosClientes') as HTMLInputElement).value;
  const celularClient = (document.getElementById('numeroCliente') as HTMLInputElement).value;
  const numeroci = (document.getElementById('ci') as HTMLInputElement).value;
  this.notaVenta= (document.getElementById('ventaNotas') as HTMLInputElement).value;
  const ciEntero = numeroci;
  // Lógica para determinar el cliente a guardar o actualizar
  console.log(this.clienteSeleccionado)
  if (this.clienteSeleccionado.ci!=='0' && this.clienteSeleccionado.nombre!=='') {
    // Si hay un cliente seleccionado, compara los campos.
    console.log("no deberia de entrar ya que no se selecciono a nadie")
    if (
      this.clienteSeleccionado.ci === ciEntero &&
      this.clienteSeleccionado.nombre === nombreClient &&
      this.clienteSeleccionado.appaterno === (apellidosClient.split(' ')[0] || '') &&
      this.clienteSeleccionado.apmaterno === (apellidosClient.split(' ')[1] || '') &&
      this.clienteSeleccionado.telefono === celularClient
    ) {
      // Si los datos son iguales, usa el cliente seleccionado directamente.
      clienteParaGuardar = this.clienteSeleccionado;
      console.log('Cliente existente, no se requiere actualización.');
      // Directamente se puede pasar al siguiente paso de guardar la venta
      this.iniciarTransaccion(clienteParaGuardar);
    } else {
      // Si los datos han cambiado, se actualiza el cliente existente.
      console.log('Datos de cliente modificados, actualizando...');
      this.clienteSeleccionado.ci=ciEntero;
      this.clienteSeleccionado.nombre = nombreClient;
      this.clienteSeleccionado.appaterno = apellidosClient.split(' ')[0] || '';
      this.clienteSeleccionado.apmaterno = apellidosClient.split(' ')[1] || '';
      this.clienteSeleccionado.telefono = celularClient;
      
      this.clienteS.update(this.clienteSeleccionado)
        .pipe(
          catchError((error) => {
            console.error('Error al actualizar el cliente:', error);
            return throwError(() => new Error('Error al actualizar el cliente.'));
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Cliente actualizado:', response.data);
            this.iniciarTransaccion(response.data);
          },
          error: (err) => {
            console.error('Transacción de venta fallida por error en actualización de cliente.', err);
          }
        });
    }
  } else {
    console.log('entro por que no se encontreo a nadie o slecciono')
    // No hay cliente seleccionado, se crea uno nuevo.
    clienteParaGuardar = {
      ci: ciEntero,
      nombre: nombreClient,
      appaterno: apellidosClient.split(' ')[0] || '',
      apmaterno: apellidosClient.split(' ')[1] || '',
      telefono: celularClient,
    };
    console.log('Creando nuevo cliente.');
    this.iniciarTransaccion(clienteParaGuardar);
  }
}

private iniciarTransaccion(cliente: clientes) {
  let ventaId: number;
  let clienteId: number;
  
  this.clienteS
    .save(cliente)
    .pipe(
      catchError((error) => {
        console.error('Error al guardar el cliente:', error);
        return throwError(() => new Error('Error en el paso de Cliente'));
      }),
      concatMap((responseCliente) => {
        console.log('Cliente guardado:', responseCliente);
        clienteId = responseCliente.data.idCliente;
        const ventaNueva: ventas = {
          cliente: responseCliente.data,
          total: this.calcularTotal(), // Asegúrate de que este método exista y devuelva un número
          trabajador: this.usuarioTrabajador,
          formaPago: this.formaPago,
          descuento: this.descuento,
          notas:this.notaVenta,
        };
        return this.ventasS.save(ventaNueva).pipe(
          catchError((errorVenta) => {
            console.error('Error al guardar la venta. Revirtiendo cliente...', errorVenta);
            this.clienteS.deleteById(clienteId).subscribe(
              () => console.log('Cliente revertido con éxito.'),
              (reversionError) => console.error('Error al revertir el cliente:', reversionError)
            );
            return throwError(() => new Error('Error en el paso de Venta'));
          })
        );
      }),
      concatMap((responseVenta) => {
        console.log('Venta realizada:', responseVenta);
        ventaId = responseVenta.data.id;
        if (this.productosPorVender.length === 0) {
          return of(responseVenta);
        }
        const detalleVentaSaves = this.productosPorVender.map((producto) => {
          producto.venta = responseVenta.data;
          return this.detalleVentaS.save(producto);
        });
        return forkJoin(detalleVentaSaves).pipe(
          catchError((errorDetalles) => {
            console.error('Error al guardar detalles. Revirtiendo venta...', errorDetalles);
            this.ventasS.deleteById(ventaId).subscribe(
              () => console.log('Venta revertida con éxito.'),
              (reversionError) => console.error('Error al revertir la venta:', reversionError)
            );
            return throwError(() => new Error('Error en el paso de Detalles de Venta'));
          })
        );
      })
    )
    .subscribe({
      next: (finalResponse) => {
        console.log('Transacción de venta completada exitosamente.');
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();

        const successModalElement = document.getElementById('successModal');
        if (successModalElement) {
          successModalElement.addEventListener('hidden.bs.modal', (event: any) => {
            this.cerrarModalYRedirigir();
          }, { once: true });
        }
      },
      error: (err) => {
        console.error('Transacción de venta fallida. Se ha revertido lo necesario.', err);
        // Aquí puedes agregar un modal de error si lo deseas.
      },
    });
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
    } else if (num === -1 && this.cantidadesEnVenta[globalIndex] > 1) {
      this.cantidadesEnVenta[globalIndex]--;
    }
    this.cdr.detectChanges();
  }

  actualizarCantidadManual(index: number, event: any) {
    const globalIndex = (this.currentPage - 1) * this.pageSize + index;
    let newQuantity = parseInt(event.target.value, 10);
    const productInStock = this.filteredProducts[globalIndex];

    newQuantity = Math.round(newQuantity);

    if (isNaN(newQuantity) || newQuantity < 1) {
      this.cantidadesEnVenta[globalIndex] = 1;
      return;
    }

    if (productInStock && newQuantity > productInStock.cantidad) {
      console.error(
        'No hay suficiente stock para este producto. Stock disponible: ' +
          productInStock.cantidad
      );
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

  anadirVentaTemporal(producto: productos, cantidad: number) {
    const productoExistente = this.productosPorVender.find(
      (item) => item.producto.idProducto === producto.idProducto
    );

    let cantidadTotalVenta = cantidad;

    if (productoExistente) {
      cantidadTotalVenta = productoExistente.cantidad + cantidad;
    }

    const productoEnStock = this.products.find(
      (p) => p.producto.idProducto === producto.idProducto
    );

    const globalIndex = this.products.findIndex(
      (p) => p.producto.idProducto === producto.idProducto
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
      //productoEnStock.cantidad=0;
      return;
    }

    if (productoExistente) {
      productoExistente.cantidad = cantidadTotalVenta;
    } else {
      this.productosPorVender.push({
        producto: producto,
        venta: { id: 0 } as any, // Temporalmente asignamos un id de venta 0, se actualizará al guardar la venta
        cantidad: cantidadTotalVenta,
        precioUnitario: producto.precio||0,
        subtotal: cantidadTotalVenta * (producto.precio||0),
      });
    }

    const filteredIndex = this.filteredProducts.findIndex(
      (p) => p.producto.idProducto === producto.idProducto
    );
    if (filteredIndex !== -1) {
      this.cantidadesEnVenta[filteredIndex] = 1;
    }

    this.aplicarFiltro();

    console.log('Productos por vender:', this.productosPorVender);
  }

  eliminarVentaTemporal(index: number) {
    this.productosPorVender.splice(index, 1);
  }

  calcularSubtotal(): number {
    return this.productosPorVender.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    );
  }

  calcularTotal(): number {
    return this.calcularSubtotal();
  }
  onCategoryChange(category: string): void {
    this.filterCategory = category;
    this.aplicarFiltro();
  }

  obtenerMetodoDePago(valor: string) {
    this.metodoDePagoSeleccionado = valor;
    if (this.metodoDePagoSeleccionado == 'QR') {
      this.codigoMetodoPago = 1111;
    }
    this.formaPagoS.findById(this.codigoMetodoPago).subscribe({
      next: (Response) => {
        this.formaPago = Response.data;
      },
    });

    console.log('Método de pago seleccionado:', this.metodoDePagoSeleccionado);
  }

  // Nuevo método para filtrar clientes (actualizado para incluir apMaterno en el filtro)
  filtrarClientes() {
    if (this.clienteNombreBuscador.length > 0) {
      const terminoBusqueda = this.clienteNombreBuscador.toLowerCase();
      this.clientesFiltrados = this.clienteExistes.filter((cliente) => {
        const nombreCompleto = `${cliente.nombre} ${cliente.appaterno || ''} ${
          cliente.apmaterno || ''
        }`.toLowerCase();
        return nombreCompleto.includes(terminoBusqueda);
      });
    } else {
      this.clientesFiltrados = [];
    }
  }

  // MÉTODO MODIFICADO: Combina ambos apellidos en un solo campo
  seleccionarCliente(cliente: clientes) {
  this.clienteSeleccionado = cliente;
  console.log(this.clienteSeleccionado);
  // Concatena apPaterno y apMaterno para el campo del buscador
  this.clienteNombreBuscador = `${cliente.nombre} ${
    cliente.appaterno || ''
  } ${cliente.apmaterno || ''}`;

  // Copia todas las propiedades del cliente
  this.clienteVenta = { ...cliente };

  // Concatena apPaterno y apMaterno en el campo apPaterno del formulario
  this.clienteVenta.appaterno = `${cliente.appaterno || ''} ${
    cliente.apmaterno || ''
  }`.trim();

  this.clientesFiltrados = [];

  // ⚠️ Agrega esta línea para bloquear el input del CI
  this.isCiDisabled = true;
}

  // Nuevo método para cargar los clientes existentes
  buscadorCliente() {
    this.clienteS.findAll().subscribe({
      next: (Response) => {
        this.clienteExistes = Response.data;
        console.log('Clientes existentes cargados:', this.clienteExistes);
      },
    });
  }
  //limpiar los datos del cliente al apretar cancelar
  limpiarDatosCliente() {
  this.clienteVenta = { ci: '0', nombre: '', appaterno: '', apmaterno: '', telefono: '' };
  this.clienteSeleccionado = { ci: '0', nombre: '' };
  this.clienteNombreBuscador = '';
  this.clientesFiltrados = [];
  this.isCiDisabled = false;
}
  validarDescuento(): void {
    const subtotal = this.calcularSubtotal();
    const maxDescuento = subtotal * 0.5; // El 50% del subtotal

    if (this.descuento > maxDescuento) {
      this.descuento = maxDescuento;
    }

    if (this.descuento < 0) {
      this.descuento = 0;
    }
  }
  // Métodos de prueba
  prueba() {
    console.log(this.metodoDePagoSeleccionado);
  }
}
