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
import { usuarios } from '../../../models/PersonModel/usuarios'; // Asegúrate de importar la interfaz usuarios
import { ApiResponse } from '../../../models/api-response';

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
    this.buscadorCliente();
    this.cargarUsuarioTrabajador();
  }

  // 🔥 NUEVAS PROPIEDADES PARA CONTROLAR MODALES
  mostrarConfirmModal: boolean = false;
  mostrarSuccessModal: boolean = false;

  // Propiedades existentes
  usuarioTrabajador: usuarios = {
    username: localStorage.getItem('current_username') || '',
    email: '',
    estado: 1,
    fechaCreacion: '',
    passwordHash: '',
    persona: {ci: '' , nombre: '', apellidom: '', apellidop: '', direccion: '', telefono: ''},
    rol: { idRol: 0, nombreRol: '', descripcion: ''}
  };

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
  
  descuento: number = 0.0;
  notaVenta:string='';
  isCiDisabled: boolean = false;

  formaPago: forma_pago = {
    idFormaPago: 3333,
    nombre: 'Efectivo',
    descripcion: 'Pago a través de la plataforma',
    estado: 'Activo',
  };

  // 🔥 MÉTODOS PARA CONTROLAR MODALES

  abrirModalConfirmacion(): void {
    this.buscadorCliente();
    this.mostrarConfirmModal = true;
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
  }

  cerrarModalConfirmacion(): void {
    this.mostrarConfirmModal = false;
    this.limpiarDatosCliente();
    this.restaurarScrollBody();
  }

  abrirModalExito(): void {
    this.mostrarSuccessModal = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalExito(): void {
    this.mostrarSuccessModal = false;
    this.restaurarScrollBody();
    this.cerrarModalYRedirigir();
  }

  cerrarModales(): void {
    if (this.mostrarConfirmModal) {
      this.cerrarModalConfirmacion();
    }
    if (this.mostrarSuccessModal) {
      this.cerrarModalExito();
    }
  }

  private restaurarScrollBody(): void {
    document.body.style.overflow = 'auto';
  }

  cargarUsuarioTrabajador(): void {
    const username = localStorage.getItem('current_username');
    if (username) {
      this.usuarioTrabajador.username = username;
    }
  }

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

  showModalMessage(title: string, message: string, isSuccess: boolean) {
    console.log(`${title}: ${message}`);
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
    if (this.cantidadesEnVenta.length !== this.filteredProducts.length) {
  this.cantidadesEnVenta = this.filteredProducts.map(() => 1);
}
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
  
  this.clienteS
    .save(cliente)
    .pipe(
      catchError((error) => {
        console.error('Error al guardar el cliente:', error);
        return throwError(() => new Error('Error en el paso de Cliente'));
      }),
      concatMap((responseCliente) => {
        console.log('Cliente guardado:', responseCliente);
        
        const ventaNueva: ventas = {
          cliente: responseCliente.data,
          total: this.calcularTotal(),
          trabajador: this.usuarioTrabajador,
          formaPago: { idFormaPago: this.codigoMetodoPago },
          descuento: this.descuento,
          notas: this.notaVenta,
        };
        
        console.log('Datos de venta a enviar:', ventaNueva);
        
        return this.ventasS.save(ventaNueva).pipe(
          catchError((errorVenta) => {
            console.error('Error al guardar la venta. Revirtiendo cliente...', errorVenta);
            const clienteCiNumber = Number(cliente.ci);
            if (!isNaN(clienteCiNumber)) {
              this.clienteS.deleteById(clienteCiNumber).subscribe(
                () => console.log('Cliente revertido con éxito.'),
                (reversionError) => console.error('Error al revertir el cliente:', reversionError)
              );
            } else {
              console.error('Error: CI del cliente no es un número válido:', cliente.ci);
            }
            return throwError(() => new Error('Error en el paso de Venta'));
          })
        );
      }),
      concatMap((responseVenta:ApiResponse) => {
        console.log('Venta realizada:', responseVenta.data.idVenta);
        console.log(responseVenta)
        ventaId = responseVenta.data.idVenta;
        
        if (this.productosPorVender.length === 0) {
          return of(responseVenta);
        }
        
        const detalleVentaSaves = this.productosPorVender.map((producto) => {
          producto.venta = responseVenta.data;
          producto.venta.formaPago = { idFormaPago: this.codigoMetodoPago };
          console.log('Guardando detalle de venta:', producto);

          return this.detalleVentaS.save(producto);
        });
        
        return forkJoin(detalleVentaSaves).pipe(
          catchError((errorDetalles) => {
            console.error('Error al guardar detalles. Revirtiendo venta...', errorDetalles);
            console.log('Venta ID a revertir:', ventaId);
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
        
        // Cerrar modal de confirmación y abrir modal de éxito
        this.cerrarModalConfirmacion();
        this.abrirModalExito();
        
        this.productosPorVender = [];
        this.descuento = 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Transacción de venta fallida. Se ha revertido lo necesario.', err);
      },
    });
}

  cerrarModalYRedirigir() {
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
      return;
    }

    if (productoExistente) {
      productoExistente.cantidad = cantidadTotalVenta;
    } else {
      this.productosPorVender.push({
        producto: producto,
        venta: { id: 0 } as any,
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
    this.cdr.detectChanges();

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

  seleccionarCliente(cliente: clientes) {
    this.clienteSeleccionado = cliente;
    console.log(this.clienteSeleccionado);
    
    this.clienteNombreBuscador = `${cliente.nombre} ${
      cliente.appaterno || ''
    } ${cliente.apmaterno || ''}`;

    this.clienteVenta = { ...cliente };

    this.clienteVenta.appaterno = `${cliente.appaterno || ''} ${
      cliente.apmaterno || ''
    }`.trim();

    this.clientesFiltrados = [];
    this.isCiDisabled = true;
  }

  buscadorCliente() {
    this.clienteS.findAll().subscribe({
      next: (Response) => {
        this.clienteExistes = Response.data;
        console.log('Clientes existentes cargados:', this.clienteExistes);
      },
    });
  }

  limpiarDatosCliente() {
    this.clienteVenta = { ci: '0', nombre: '', appaterno: '', apmaterno: '', telefono: '' };
    this.clienteSeleccionado = { ci: '0', nombre: '' };
    this.clienteNombreBuscador = '';
    this.clientesFiltrados = [];
    this.isCiDisabled = false;
  }

  validarDescuento(): void {
    const subtotal = this.calcularSubtotal();
    const maxDescuento = subtotal * 0.5;

    if (this.descuento > maxDescuento) {
      this.descuento = maxDescuento;
    }

    if (this.descuento < 0) {
      this.descuento = 0;
    }
  }

  prueba() {
    console.log(this.metodoDePagoSeleccionado);
  }
}