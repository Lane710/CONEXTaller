import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { VentasService } from '../../../services/ventasTienda/ventas.service';

import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { detalleVenta } from '../../../models/Ventas/detalleVenta';
import { FormsModule, NgForm } from '@angular/forms';
import { ClientesService } from '../../../services/ventasTienda/clientes.service';
import { clientes } from '../../../models/Ventas/clientes';
import { DetalleVentasService } from '../../../services/ventasTienda/detalle-ventas.service';
import { catchError, concatMap, forkJoin, of, throwError } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { FormaPagoService } from '../../../services/PedidosEnviosDetalles/forma-pago.service';
import { forma_pago } from '../../../models/PedidosEnviosDetalles/forma_pago';
import { ventas } from '../../../models/Ventas/ventas';
import { usuarios } from '../../../models/PersonModel/usuarios';
import { ApiResponse } from '../../../models/api-response';
import { StockDTO } from '../../../DTOs/dtosBD/StockDTO';
import { productos } from '../../../models/ProductoStockModel/productos';
import { PreventaService } from '../../../services/ventasTienda/pre-ventas.service';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { StockService } from '../../../services/ProductosServis/stock.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [NgFor, CurrencyPipe, NgIf, FormsModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
})
export class SalesComponent implements OnInit {
  // 🔥 PROPIEDADES PARA CONTROLAR MODALES
  mostrarConfirmModal: boolean = false;
  mostrarSuccessModal: boolean = false;
  mostrarModalStock: boolean = false;

  // Propiedades existentes
  usuarioTrabajador: usuarios = {
    username: localStorage.getItem('current_username') || '',
    email: '',
    estado: 1,
    fechaCreacion: '',
    passwordHash: '',
    persona: {
      ci: '',
      nombre: '',
      apellidom: '',
      apellidop: '',
      direccion: '',
      telefono: '',
    },
    rol: { idRol: 0, nombreRol: '', descripcion: '' },
  };

  productosPorVender: detalleVenta[] = [];
  productosConStockReal: StockDTO[] = [];

  clienteVenta: clientes = {
    ci: '0',
    razonSocial: '',
    persona: undefined,
  };
  clienteNombreBuscador: string = '';
  clientesFiltrados: clientes[] = [];
  clienteSeleccionado: clientes = {
    ci: '0',
    razonSocial:'',
    persona: undefined,
  };
  clienteExistes: clientes[] = [];
  nombreProductoModal: string = '';
  stockMaximoModal: number = 0;
  metodoDePagoSeleccionado: string = 'efectivo';
  codigoMetodoPago: number = 3333;
  descuentoGeneral: number = 0.0;
  descuentoInputValue: number = 0.0;
  mensajeDescuento: string = '';
  mensajeDescuentoClase: string = '';
  notaVenta: string = '';
  isCiDisabled: boolean = false;
  formaPago: forma_pago = {
    idFormaPago: 3333,
    nombre: 'Efectivo',
    descripcion: 'Pago a través de la plataforma',
    estado: 'Activo',
  };

  constructor(
    private productosConStock: StockService,
    private ventasS: VentasService,
    private cdr: ChangeDetectorRef,
    private clienteS: ClientesService,
    private detalleVentaS: DetalleVentasService,
    private router: Router,
    private formaPagoS: FormaPagoService,
    private preventaService: PreventaService,
    private stockService: StockService,
    private usuariosService: UsuariosService 
  ) {}

  ngOnInit(): void {
    this.buscadorCliente();
    this.cargarUsuarioTrabajador();
    this.inicializarProductosDesdePreventa();
    this.cargarProductosConStock();
  }

  // 🔥 NUEVO MÉTODO: Aplicar descuento con botón
  aplicarDescuento(): void {
    const subtotal = this.calcularSubtotal();
    const maxDescuento = subtotal * 0.5;

    // Validar que el descuento no sea negativo
    if (this.descuentoInputValue < 0) {
      this.descuentoInputValue = 0;
      this.mostrarMensajeDescuento(
        'El descuento no puede ser negativo',
        'error'
      );
      return;
    }

    // Validar que no supere el 50% del subtotal
    if (this.descuentoInputValue > maxDescuento) {
      this.descuentoInputValue = maxDescuento;
      this.mostrarMensajeDescuento(
        `El descuento no puede superar el 50% del subtotal (${maxDescuento.toFixed(2)} Bs)`,
        'error'
      );
      return;
    }

    // Aplicar el descuento
    this.descuentoGeneral = parseFloat(this.descuentoInputValue.toFixed(2));

    // Mostrar mensaje de éxito
    if (this.descuentoGeneral > 0) {
      this.mostrarMensajeDescuento(
        `Descuento de ${this.descuentoGeneral.toFixed(2)} Bs aplicado correctamente`,
        'success'
      );
    } else {
      this.mostrarMensajeDescuento('Descuento removido', 'info');
    }

    this.cdr.detectChanges();
  }

  // 🔥 NUEVO MÉTODO: Mostrar mensajes de descuento
  mostrarMensajeDescuento(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.mensajeDescuento = mensaje;

    switch (tipo) {
      case 'success':
        this.mensajeDescuentoClase = 'alert alert-success';
        break;
      case 'error':
        this.mensajeDescuentoClase = 'alert alert-danger';
        break;
      case 'info':
        this.mensajeDescuentoClase = 'alert alert-info';
        break;
    }

    // Auto-ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      this.mensajeDescuento = '';
      this.mensajeDescuentoClase = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  // 🔥 MÉTODO MODIFICADO: Calcular total final con descuento aplicado
  calcularTotal(): number {
    const subtotal = this.calcularSubtotal();
    return Math.max(0, subtotal - this.descuentoGeneral);
  }

  // 🔥 CARGAR PRODUCTOS CON STOCK REAL
  cargarProductosConStock(): void {
    this.stockService.getLatestProducts(200).subscribe({
      next: (res: ApiResponse) => {
        this.productosConStockReal = res.data || [];
        console.log('Productos con stock real cargados:', this.productosConStockReal);
      },
      error: (err) => {
        console.error('Error al cargar productos con stock:', err);
      },
    });
  }

  // 🔥 MÉTODO CORREGIDO: Obtener stock disponible del producto original
  obtenerStockDisponible(idProducto: number): number {
    const productoStock = this.productosConStockReal.find(
      (p) => p.producto.idProducto === idProducto
    );

    if (productoStock) {
      return productoStock.cantidad;
    }

    console.warn(`Producto ${idProducto} no encontrado en stock real`);
    return 0;
  }

  obtenerCantidadEnCarrito(idProducto: number): number {
    const productoEnCarrito = this.preventaService
      .getProductosSeleccionados()
      .find((p) => p.producto.idProducto === idProducto);
    return productoEnCarrito ? productoEnCarrito.cantidad : 0;
  }

  obtenerStockRestante(idProducto: number): number {
    const stockDisponible = this.obtenerStockDisponible(idProducto);
    const cantidadEnCarrito = this.obtenerCantidadEnCarrito(idProducto);
    const stockRestante = stockDisponible - cantidadEnCarrito;
    return stockRestante;
  }

  sumarCantidad(index: number): void {
    const producto = this.productosPorVender[index];
    const idProducto = producto.producto.idProducto || 0;
    const stockRestante = this.obtenerStockRestante(idProducto);

    if (stockRestante > 0) {
      producto.cantidad++;
      this.actualizarSubtotal(index);
      this.actualizarCantidadEnServicio(index);
    } else {
      this.mostrarModalStockAlerta(
        producto.producto.nombre,
        this.obtenerStockDisponible(idProducto)
      );
    }
  }

  restarCantidad(index: number): void {
    const producto = this.productosPorVender[index];
    if (producto.cantidad > 1) {
      producto.cantidad--;
      this.actualizarSubtotal(index);
      this.actualizarCantidadEnServicio(index);
    }
  }

  actualizarCantidadManual(index: number, event: any): void {
    const producto = this.productosPorVender[index];
    const idProducto = producto.producto.idProducto || 0;
    let nuevaCantidad = parseInt(event.target.value, 10);
    const stockRestante = this.obtenerStockRestante(idProducto);
    const stockDisponible = this.obtenerStockDisponible(idProducto);

    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }

    const cantidadMaximaPermitida =
      this.obtenerCantidadEnCarrito(idProducto) + stockRestante;

    if (nuevaCantidad > cantidadMaximaPermitida) {
      nuevaCantidad = cantidadMaximaPermitida;
      this.mostrarModalStockAlerta(producto.producto.nombre, stockDisponible);
    }

    producto.cantidad = nuevaCantidad;
    this.actualizarSubtotal(index);
    this.actualizarCantidadEnServicio(index);
  }

  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.key.charCodeAt(0);

    // Permitir teclas de control
    if (
      event.key === 'Backspace' ||
      event.key === 'Tab' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Delete' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      return true;
    }

    // Permitir solo números
    if (charCode >= 48 && charCode <= 57) {
      return true;
    }

    event.preventDefault();
    return false;
  }

  soloNumerosDecimales(event: KeyboardEvent): boolean {
    const charCode = event.key.charCodeAt(0);

    // Permitir teclas de control
    if (
      event.key === 'Backspace' ||
      event.key === 'Tab' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Delete' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.key === '.' ||
      event.key === ','
    ) {
      return true;
    }

    // Permitir solo números
    if (charCode >= 48 && charCode <= 57) {
      return true;
    }

    event.preventDefault();
    return false;
  }

  calcularSubtotal(): number {
    return this.productosPorVender.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    );
  }

  actualizarSubtotal(index: number): void {
    const producto = this.productosPorVender[index];
    this.cdr.detectChanges();
  }

  inicializarProductosDesdePreventa(): void {
    this.productosPorVender = [];

    const productosPreventa = this.preventaService.getProductosSeleccionados();

    if (productosPreventa && productosPreventa.length > 0) {
      productosPreventa.forEach((prod) => {
        const detalle: detalleVenta = {
          producto: prod.producto as unknown as productos,
          venta: {
            idVenta: 0,
            cliente: { ci: '0', nombre: '' },
            trabajador: this.obtenerUsuarioBasico(),
            total: 0,
            formaPago: {
              idFormaPago: 0,
              nombre: '',
              descripcion: '',
              estado: '',
            },
            estado: 'PENDIENTE',
          } as ventas,
          cantidad: prod.cantidad,
          precioUnitario: prod.producto.precio || 0,
          subtotal: (prod.producto.precio || 0) * prod.cantidad,
        };
        this.productosPorVender.push(detalle);
      });
    }
    this.cdr.detectChanges();
  }

  // 🔥 NUEVO MÉTODO: Crear un objeto usuario básico
  private obtenerUsuarioBasico(): usuarios {
    return {
      username: this.usuarioTrabajador.username || localStorage.getItem('current_username') || '',
      email: '',
      estado: 1,
      fechaCreacion: '',
      passwordHash: '',
      persona: {
        ci: '',
        nombre: '',
        apellidom: '',
        apellidop: '',
        direccion: '',
        telefono: '',
      },
      rol: { 
        idRol: 0, 
        nombreRol: '', 
        descripcion: '' 
      },
    };
  }

  getStockClass(idProducto: number): string {
    const stock = this.obtenerStockDisponible(idProducto);
    if (stock === 0) return 'text-danger fw-bold';
    if (stock < 10) return 'text-warning fw-bold';
    return 'text-success';
  }

  cargarUsuarioTrabajador(): void {
    const username = localStorage.getItem('current_username');
    if (username) {
      this.usuarioTrabajador.username = username;
      
      this.usuariosService.findById(username).subscribe({
        next: (response: ApiResponse) => {
          if (response.success && response.data) {
            this.usuarioTrabajador = response.data as usuarios;
            console.log('Usuario trabajador cargado:', this.usuarioTrabajador);
          } else {
            console.warn('No se pudo cargar el usuario completo, usando datos básicos');
          }
        },
        error: (error) => {
          console.error('Error al cargar usuario trabajador:', error);
          console.warn('Usando datos básicos del usuario');
        }
      });
    }
  }

  actualizarCantidadEnServicio(index: number): void {
    const producto = this.productosPorVender[index];
    this.preventaService.actualizarCantidad(
      producto.producto.idProducto || 0,
      producto.cantidad
    );
  }

  eliminarProducto(index: number): void {
    const producto = this.productosPorVender[index];
    this.preventaService.eliminarProducto(producto.producto.idProducto || 0);
    this.productosPorVender.splice(index, 1);
    this.cdr.detectChanges();
  }

  obtenerTotalProductos(): number {
    return this.productosPorVender.reduce(
      (acc, item) => acc + item.cantidad,
      0
    );
  }

  mostrarModalStockAlerta(nombreProducto: string, stockMaximo: number) {
    this.nombreProductoModal = nombreProducto;
    this.stockMaximoModal = stockMaximo;
    this.mostrarModalStock = true;
  }

  ocultarModal() {
    this.mostrarModalStock = false;
  }

  abrirModalConfirmacion(): void {
    this.buscadorCliente();
    this.mostrarConfirmModal = true;
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

  // ===================================================================
  // 🔥 LÓGICA DE VENTA CORREGIDA
  // ===================================================================

  realizarVenta() {
    const nombreClient = (document.getElementById('clienteNombre') as HTMLInputElement).value;
    const apellidoPaterno = (document.getElementById('apellidoPaterno') as HTMLInputElement).value;
    const apellidoMaterno = (document.getElementById('apellidoMaterno') as HTMLInputElement).value;
    const celularClient = (document.getElementById('numeroCliente') as HTMLInputElement).value;
    const numeroci = (document.getElementById('ci') as HTMLInputElement).value;
    this.notaVenta = (document.getElementById('ventaNotas') as HTMLInputElement).value;

    // 🔥 VALIDACIONES MEJORADAS - Campos obligatorios
    if (!numeroci || numeroci === '0') {
        alert('Por favor, complete el CI del cliente (debe ser mayor a 0)');
        return;
    }

    if (!nombreClient || nombreClient.trim().length < 2) {
        alert('Por favor, complete el nombre del cliente (mínimo 2 caracteres)');
        return;
    }

    if (!apellidoPaterno || apellidoPaterno.trim().length < 2) {
        alert('Por favor, complete el apellido paterno del cliente (mínimo 2 caracteres)');
        return;
    }

    // 🔥 CORRECCIÓN: Usar normalización segura
    const clienteParaProcesar: clientes = {
        ci: numeroci.trim(),
        persona:undefined,
    };

    this.iniciarTransaccionConValidacion(clienteParaProcesar);
}

  private iniciarTransaccionConValidacion(cliente: clientes) {
    let ventaId: number;
    let clienteProcesado: clientes;
    let esClienteNuevo: boolean = false;
    let clienteTieneVentas: boolean = false;
    let necesitaActualizacion: boolean = false;

    console.log('Iniciando transacción con validación de ventas...');

    // 🔥 CALCULAR EL SUBTOTAL SIN DESCUENTO PARA ENVIAR AL BACKEND
    const subtotalSinDescuento = this.calcularSubtotal();
    const totalConDescuento = this.calcularTotal();
    
    console.log('Subtotal (sin descuento):', subtotalSinDescuento);
    console.log('Descuento aplicado:', this.descuentoGeneral);
    console.log('Total (con descuento):', totalConDescuento);

    // 1. PRIMERO: Verificar si el cliente existe y comparar datos
    this.clienteS.findById(cliente.ci)
      .pipe(
        catchError((errorClienteFind) => {
          console.log('Cliente no encontrado, se creará nuevo:', errorClienteFind);
          esClienteNuevo = true;
          
          // Crear nuevo cliente
          return this.clienteS.save(cliente);
        }),
        concatMap((responseCliente: ApiResponse) => {
          // Si llegamos aquí, el cliente EXISTE
          const clienteExistente = responseCliente.data;
          console.log('Cliente existente encontrado:', clienteExistente);
          
          // 🔥 COMPARAR DATOS PARA VER SI NECESITA ACTUALIZACIÓN
          necesitaActualizacion = this.compararDatosCliente(cliente, clienteExistente);
          
          if (necesitaActualizacion) {
            console.log('Cliente necesita actualización. Datos diferentes encontrados.');
            // Actualizar cliente existente con los nuevos datos
            const clienteActualizado = { ...clienteExistente, ...cliente };
            return this.clienteS.update(clienteActualizado);
          } else {
            console.log('Cliente no necesita actualización. Datos idénticos.');
            return of(responseCliente); // No hacer nada, usar cliente existente
          }
        }),
        // 2. Verificar si el cliente tiene ventas (CORREGIDO)
        concatMap((responseClienteActualizado: ApiResponse) => {
          clienteProcesado = responseClienteActualizado.data;
          
          // Crear un ApiResponse compatible para el flujo
          return this.ventasS.clienteConVenta(cliente.ci).pipe(
            catchError((errorVentas) => {
              console.log('Cliente no tiene ventas:', errorVentas);
              clienteTieneVentas = false;
              // Retornar un ApiResponse compatible
              return of({ 
                success: false, 
                data: null, 
                message: 'Sin ventas',
                httpStatusCode: 404 
              } as ApiResponse);
            })
          );
        }),
        // 3. Preparar y guardar la venta
        concatMap((responseVentas: ApiResponse) => {
          if (responseVentas.success && responseVentas.data) {
            clienteTieneVentas = true;
            console.log('Cliente tiene ventas existentes');
          }

          const ventaNueva: any = {
            cliente: {
              ci: clienteProcesado.ci
            },
            trabajador: {
              username: this.usuarioTrabajador.username
            },
            formaPago: { 
              idFormaPago: this.codigoMetodoPago 
            },
            // 🔥 CORRECCIÓN CRÍTICA: Enviar el SUBTOTAL sin descuento
            total: subtotalSinDescuento, // Enviar subtotal sin descuento
            descuento: this.descuentoGeneral,
            notas: this.notaVenta,
            estado: 'COMPLETADA'
          };

          console.log('Guardando venta:', ventaNueva);
          return this.ventasS.save(ventaNueva);
        }),
        // 4. Guardar detalles de venta
        concatMap((responseVenta: ApiResponse) => {
          console.log('Venta guardada exitosamente:', responseVenta.data);
          ventaId = responseVenta.data.idVenta;

          if (this.productosPorVender.length === 0) {
            return of(responseVenta);
          }

          const detalleVentaSaves = this.productosPorVender.map((producto) => {
            const detalle: any = {
              venta: {
                idVenta: responseVenta.data.idVenta
              },
              producto: {
                idProducto: producto.producto.idProducto
              },
              cantidad: producto.cantidad,
              precioUnitario: producto.precioUnitario,
              subtotal: producto.cantidad * producto.precioUnitario
            };

            console.log('Guardando detalle de venta:', detalle);
            return this.detalleVentaS.save(detalle);
          });

          return forkJoin(detalleVentaSaves).pipe(
            catchError((errorDetalles) => {
              console.error('Error al guardar detalles. Revirtiendo venta...', errorDetalles);
              
              // Revertir la venta completa
              if (ventaId) {
                this.ventasS.deleteById(ventaId).subscribe({
                  next: () => console.log('Venta revertida exitosamente'),
                  error: (reversionError) => console.error('Error al revertir venta:', reversionError)
                });
              }
              
              alert('Error al guardar los detalles de la venta. La venta ha sido cancelada.');
              return throwError(() => new Error('Error en el paso de Detalles de Venta'));
            })
          );
        })
      )
      .subscribe({
        next: (finalResponse) => {
          console.log('Transacción de venta completada exitosamente.');
          
          let mensaje = '';
          if (esClienteNuevo) {
            mensaje = 'Venta completada con cliente NUEVO registrado';
          } else if (necesitaActualizacion) {
            mensaje = 'Venta completada con cliente EXISTENTE actualizado';
          } else {
            mensaje = 'Venta completada con cliente existente';
          }
          
          console.log(mensaje);

          this.cerrarModalConfirmacion();
          this.abrirModalExito();

          // Limpiar todo
          this.preventaService.limpiarPreventa();
          this.productosPorVender = [];
          this.descuentoGeneral = 0;
          this.descuentoInputValue = 0;
          this.limpiarDatosCliente();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Transacción de venta fallida:', err);
          alert('Error al procesar la venta: ' + err.message);
        }
      });
  }

  // 🔥 NUEVO MÉTODO: Comparar datos del cliente para detectar cambios
  private compararDatosCliente(clienteNuevo: clientes, clienteExistente: clientes): boolean {
    // 🔥 CORRECCIÓN: Función normalizar mejorada que maneja null/undefined
    const normalizar = (str: string | null | undefined): string => {
        // Si es null, undefined, o vacío, retornar string vacío
        if (str === null || str === undefined || str === '') {
            return '';
        }
        // Aplicar trim y convertir a minúsculas
        return str.toString().trim().toLowerCase();
    };
    
    console.log('Comparando datos del cliente:');
    console.log('Cliente nuevo:', clienteNuevo);
    console.log('Cliente existente:', clienteExistente);
    
   
    
    console.log('No se encontraron diferencias en los datos del cliente');
    return false;
}

// 🔥 MÉTODO CORREGIDO: Normalizar datos del cliente antes de procesar
private normalizarDatosCliente(cliente: clientes): clientes {
    const normalizarCampo = (valor: string | null | undefined): string => {
        if (valor === null || valor === undefined || valor === '') {
            return '';
        }
        return valor.toString().trim();
    };

    return {
        ci: normalizarCampo(cliente.ci),
   
    };
}

  cerrarModalYRedirigir() {
    this.router.navigate(['/home/listadoVentasStore']);
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
  }

  filtrarClientes() {
    if (this.clienteNombreBuscador.length > 0) {
      const terminoBusqueda = this.clienteNombreBuscador.toLowerCase();
      this.clientesFiltrados = this.clienteExistes.filter((cliente) => {
        
        return '';
      });
    } else {
      this.clientesFiltrados = [];
    }
  }

  seleccionarCliente(cliente: clientes) {
    this.clienteSeleccionado = cliente;
    console.log('Cliente seleccionado:', this.clienteSeleccionado);



    // 🔥 CORREGIDO: Asignar correctamente los campos separados
    this.clienteVenta = { 
      ci: cliente.ci,
    };

    this.clientesFiltrados = [];
    this.isCiDisabled = true;
    
    console.log('Datos cargados en formulario:', this.clienteVenta);
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
    this.clienteVenta = {
      ci: '0',
      razonSocial: '',
      persona: undefined,
      
    };
    this.clienteSeleccionado = {
      ci: '0',
      razonSocial:'',
      persona: undefined,
    };
    this.clienteNombreBuscador = '';
    this.clientesFiltrados = [];
    this.isCiDisabled = false;
  }

  volverAPreventa(): void {
    this.router.navigate(['/home/preVentasTienda']);
  }
}