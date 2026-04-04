import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { VentasService } from '../../../services/ventasTienda/ventas.service';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { detalleVenta } from '../../../models/Ventas/detalleVenta';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../../services/ventasTienda/clientes.service';
import { clientes } from '../../../models/Ventas/clientes';
import { DetalleVentasService } from '../../../services/ventasTienda/detalle-ventas.service';
import { catchError, concatMap, forkJoin, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
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
import { ModalScanComponent } from './modal-scan.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [NgFor, CurrencyPipe, NgIf, FormsModule, ModalScanComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
})
export class SalesComponent implements OnInit {
  // 🔥 MODALES
  mostrarConfirmModal: boolean = false;
  mostrarSuccessModal: boolean = false;
  mostrarModalStock: boolean = false;
  mostrarScanModal: boolean = false;
  detallesGuardadosParaScan: any[] = [];

  esVentaRapida: boolean = false;
  clienteExistenteEnMemoria: clientes | null = null;
  inputCi: string = '';
  inputNombre: string = '';
  inputApellidoP: string = '';
  inputApellidoM: string = '';

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

  clienteNombreBuscador: string = '';
  clientesFiltrados: clientes[] = [];
  clienteSeleccionado: clientes = {
    ci: '',
    razonSocial: '',
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
    descripcion: '',
    estado: 'Activo',
  };

  constructor(
    private ventasS: VentasService,
    private cdr: ChangeDetectorRef,
    private clienteS: ClientesService,
    private detalleVentaS: DetalleVentasService,
    private router: Router,
    private formaPagoS: FormaPagoService,
    private preventaService: PreventaService,
    private stockService: StockService,
    private usuariosService: UsuariosService,
  ) {}

  ngOnInit(): void {
    this.buscadorCliente();
    this.cargarUsuarioTrabajador();
    this.inicializarProductosDesdePreventa();
    this.cargarProductosConStock();
  }

  verificarVentaRapida() {
    if (this.inputCi === '0') {
      this.esVentaRapida = true;
      this.inputNombre = 'S/N';
      this.inputApellidoP = 'S/N';
      this.inputApellidoM = '';
    } else {
      this.esVentaRapida = false;
      if (this.inputNombre === 'S/N') {
        this.inputNombre = '';
        this.inputApellidoP = '';
        this.inputApellidoM = '';
      }
    }
  }

  realizarVenta() {
    const numeroci = this.inputCi ? this.inputCi.trim() : '';

    if (!numeroci) {
      alert('El CI es obligatorio. (Ingrese 0 para venta rápida)');
      return;
    }

    if (numeroci !== '0' && (!this.inputNombre || this.inputNombre.trim().length < 2)) {
      alert('Por favor, complete el nombre del cliente');
      return;
    }

    if (numeroci !== '0' && (!this.inputApellidoP || this.inputApellidoP.trim().length < 2)) {
      alert('Por favor, complete el apellido paterno del cliente');
      return;
    }

    const clienteParaProcesar: clientes = {
      ci: numeroci,
      razonSocial:
        numeroci === '0'
          ? 'S/N'
          : `${this.inputNombre} ${this.inputApellidoP}`.trim(),
      persona: {
        ci: numeroci,
        nombre: numeroci === '0' ? 'S/N' : this.inputNombre,
        apellidop: numeroci === '0' ? 'S/N' : this.inputApellidoP,
        apellidom: this.inputApellidoM || '',
      } as any,
    };

    this.iniciarTransaccionConValidacion(clienteParaProcesar);
  }

  private iniciarTransaccionConValidacion(clienteParaProcesar: clientes) {
    let ventaId: number;

    console.log('Iniciando transacción para CI:', clienteParaProcesar.ci);
    const subtotalSinDescuento = this.calcularSubtotal();

    let accionClienteObservable;

    if (
      this.clienteExistenteEnMemoria &&
      this.clienteExistenteEnMemoria.ci === clienteParaProcesar.ci
    ) {
      const cambioRazonSocial =
        this.clienteExistenteEnMemoria.razonSocial !==
        clienteParaProcesar.razonSocial;

      if (cambioRazonSocial) {
        accionClienteObservable = this.clienteS.update(clienteParaProcesar);
      } else {
        accionClienteObservable = of({
          success: true,
          data: clienteParaProcesar,
        } as ApiResponse);
      }
    } else {
      accionClienteObservable = this.clienteS.findOrCreate(clienteParaProcesar);
    }

    accionClienteObservable
      .pipe(
        concatMap((resCliente: ApiResponse) => {
          if (!resCliente || (!resCliente.success && !resCliente.data)) {
            return throwError(
              () => new Error('Fallo en la verificación del cliente.'),
            );
          }

          const ventaNueva: any = {
            cliente: { ci: clienteParaProcesar.ci },
            trabajador: { username: this.usuarioTrabajador.username },
            formaPago: { idFormaPago: this.codigoMetodoPago },
            total: subtotalSinDescuento,
            descuento: this.descuentoGeneral,
            notas: this.notaVenta,
            estado: 'COMPLETADA',
          };
          return this.ventasS.save(ventaNueva);
        }),
        concatMap((resVenta: ApiResponse) => {
          ventaId = resVenta.data.idVenta;
          console.log('Venta creada con ID:', ventaId);

          const peticionesDetalles = this.productosPorVender.map((prod) => {
            const detalle: any = {
              venta: { idVenta: ventaId },
              producto: { idProducto: prod.producto.idProducto },
              cantidad: prod.cantidad,
              precioUnitario: prod.precioUnitario,
              subtotal: prod.cantidad * prod.precioUnitario,
              precioBase: prod.producto.precioCompra || 0,
            };
            return this.detalleVentaS.save(detalle);
          });

          return forkJoin(peticionesDetalles).pipe(
            catchError((err) => {
              console.error('Error guardando detalles, haciendo rollback...');
              this.ventasS.deleteById(ventaId).subscribe();
              return throwError(
                () => new Error('Error crítico al guardar los detalles'),
              );
            }),
          );
        }),
      )
      .subscribe({
        next: (respuestasDetalles: ApiResponse[]) => {
          console.log('Detalles guardados exitosamente. Preparando modal...');

          // 🔥 CORRECCIÓN CLAVE AQUÍ 🔥 (Estructura plana)
          const detallesFusionados = respuestasDetalles.map((res, index) => {
            const prodLocal = this.productosPorVender[index].producto;
            return {
              idDetalleVenta:
                res.data.idDetalleVenta ||
                res.data.idDetallePedido ||
                res.data.id,
              cantidad: this.productosPorVender[index].cantidad,
              idProducto: prodLocal.idProducto, // Formato plano esperado por ModalScan
              nombre: prodLocal.nombre,         // Formato plano esperado por ModalScan
              requiereSerial: prodLocal.requiereSerial // Agregamos esto solo para la validación de abajo
            };
          });

          const requiereEscaneo = detallesFusionados.some(
            (d: any) =>
              d.requiereSerial === true ||
              d.requiereSerial === 'true' ||
              d.requiereSerial === 1,
          );

          if (requiereEscaneo) {
            this.detallesGuardadosParaScan = detallesFusionados;
            this.cerrarModalConfirmacion();
            this.mostrarScanModal = true;
          } else {
            this.finalizarVentaExitosa();
          }
        },
        error: (err) => {
          console.error('Error final atrapado:', err);
          alert(
            'No se pudo registrar la venta. Motivo: Error en el procesamiento del Cliente o Servidor.',
          );
        },
      });
  }

  finalizarVentaExitosa() {
    this.cerrarModalConfirmacion();
    this.mostrarScanModal = false;
    this.abrirModalExito();

    this.preventaService.limpiarPreventa();
    this.productosPorVender = [];
    this.descuentoGeneral = 0;
    this.descuentoInputValue = 0;
    this.limpiarDatosCliente();
    this.cdr.detectChanges();
  }

  onScanCompleted() {
    this.finalizarVentaExitosa();
  }

  seleccionarCliente(cliente: clientes) {
    this.clienteSeleccionado = cliente;
    this.clienteExistenteEnMemoria = JSON.parse(JSON.stringify(cliente));

    this.inputCi = cliente.ci;
    this.inputNombre = cliente.persona?.nombre || cliente.razonSocial || '';
    this.inputApellidoP = cliente.persona?.apellidop || '';
    this.inputApellidoM = cliente.persona?.apellidom || '';

    this.clientesFiltrados = [];
    this.isCiDisabled = true;
    this.verificarVentaRapida();
  }

  limpiarDatosCliente() {
    this.inputCi = '';
    this.inputNombre = '';
    this.inputApellidoP = '';
    this.inputApellidoM = '';

    this.clienteNombreBuscador = '';
    this.clientesFiltrados = [];
    this.isCiDisabled = false;
    this.esVentaRapida = false;

    this.clienteExistenteEnMemoria = null;
  }

  aplicarDescuento(): void {
    const subtotal = this.calcularSubtotal();
    const maxDescuento = subtotal * 0.5;

    if (this.descuentoInputValue < 0) {
      this.descuentoInputValue = 0;
      this.mostrarMensajeDescuento('El descuento no puede ser negativo', 'error');
      return;
    }

    if (this.descuentoInputValue > maxDescuento) {
      this.descuentoInputValue = maxDescuento;
      this.mostrarMensajeDescuento(
        `El descuento no puede superar el 50% del subtotal (${maxDescuento.toFixed(2)} Bs)`,
        'error',
      );
      return;
    }

    this.descuentoGeneral = parseFloat(this.descuentoInputValue.toFixed(2));

    if (this.descuentoGeneral > 0) {
      this.mostrarMensajeDescuento(
        `Descuento de ${this.descuentoGeneral.toFixed(2)} Bs aplicado correctamente`,
        'success',
      );
    } else {
      this.mostrarMensajeDescuento('Descuento removido', 'info');
    }
    this.cdr.detectChanges();
  }

  mostrarMensajeDescuento(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.mensajeDescuento = mensaje;
    switch (tipo) {
      case 'success': this.mensajeDescuentoClase = 'alert alert-success'; break;
      case 'error': this.mensajeDescuentoClase = 'alert alert-danger'; break;
      case 'info': this.mensajeDescuentoClase = 'alert alert-info'; break;
    }
    setTimeout(() => {
      this.mensajeDescuento = '';
      this.mensajeDescuentoClase = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  calcularTotal(): number {
    return Math.max(0, this.calcularSubtotal() - this.descuentoGeneral);
  }

  cargarProductosConStock(): void {
    this.stockService.getLatestProducts(200).subscribe({
      next: (res: ApiResponse) => {
        this.productosConStockReal = res.data || [];
      },
      error: (err) => console.error('Error al cargar productos con stock:', err),
    });
  }

  obtenerStockDisponible(idProducto: number): number {
    const productoStock = this.productosConStockReal.find(
      (p) => p.producto.idProducto === idProducto,
    );
    return productoStock ? productoStock.cantidad : 0;
  }

  obtenerCantidadEnCarrito(idProducto: number): number {
    const productoEnCarrito = this.preventaService
      .getProductosSeleccionados()
      .find((p) => p.producto.idProducto === idProducto);
    return productoEnCarrito ? productoEnCarrito.cantidad : 0;
  }

  obtenerStockRestante(idProducto: number): number {
    return this.obtenerStockDisponible(idProducto) - this.obtenerCantidadEnCarrito(idProducto);
  }

  sumarCantidad(index: number): void {
    const producto = this.productosPorVender[index];
    const idProducto = producto.producto.idProducto || 0;
    if (this.obtenerStockRestante(idProducto) > 0) {
      producto.cantidad++;
      this.actualizarCantidadEnServicio(index);
    } else {
      this.mostrarModalStockAlerta(
        producto.producto.nombre,
        this.obtenerStockDisponible(idProducto),
      );
    }
  }

  restarCantidad(index: number): void {
    const producto = this.productosPorVender[index];
    if (producto.cantidad > 1) {
      producto.cantidad--;
      this.actualizarCantidadEnServicio(index);
    }
  }

  actualizarCantidadManual(index: number, event: any): void {
    const producto = this.productosPorVender[index];
    const idProducto = producto.producto.idProducto || 0;
    let nuevaCantidad = parseInt(event.target.value, 10);
    const stockDisponible = this.obtenerStockDisponible(idProducto);

    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) nuevaCantidad = 1;

    const cantidadMaximaPermitida =
      this.obtenerCantidadEnCarrito(idProducto) +
      this.obtenerStockRestante(idProducto);

    if (nuevaCantidad > cantidadMaximaPermitida) {
      nuevaCantidad = cantidadMaximaPermitida;
      this.mostrarModalStockAlerta(producto.producto.nombre, stockDisponible);
    }

    producto.cantidad = nuevaCantidad;
    this.actualizarCantidadEnServicio(index);
  }

  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.key.charCodeAt(0);
    if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'].includes(event.key)) return true;
    if (charCode >= 48 && charCode <= 57) return true;
    event.preventDefault();
    return false;
  }

  soloNumerosDecimales(event: KeyboardEvent): boolean {
    const charCode = event.key.charCodeAt(0);
    if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End', '.', ','].includes(event.key)) return true;
    if (charCode >= 48 && charCode <= 57) return true;
    event.preventDefault();
    return false;
  }

  calcularSubtotal(): number {
    return this.productosPorVender.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0,
    );
  }

  inicializarProductosDesdePreventa(): void {
    this.productosPorVender = [];
    const productosPreventa = this.preventaService.getProductosSeleccionados();
    if (productosPreventa && productosPreventa.length > 0) {
      productosPreventa.forEach((prod) => {
        const detalle: detalleVenta = {
          producto: prod.producto as unknown as productos,
          venta: {} as ventas,
          cantidad: prod.cantidad,
          precioUnitario: prod.producto.precio || 0,
          subtotal: (prod.producto.precio || 0) * prod.cantidad,
          precioBase: prod.producto.precioCompra || 0,
        };
        this.productosPorVender.push(detalle);
      });
    }
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
          if (response.success && response.data)
            this.usuarioTrabajador = response.data as usuarios;
        },
      });
    }
  }

  actualizarCantidadEnServicio(index: number): void {
    const producto = this.productosPorVender[index];
    this.preventaService.actualizarCantidad(
      producto.producto.idProducto || 0,
      producto.cantidad,
    );
    this.cdr.detectChanges();
  }

  eliminarProducto(index: number): void {
    const producto = this.productosPorVender[index];
    this.preventaService.eliminarProducto(producto.producto.idProducto || 0);
    this.productosPorVender.splice(index, 1);
    this.cdr.detectChanges();
  }

  obtenerTotalProductos(): number {
    return this.productosPorVender.reduce((acc, item) => acc + item.cantidad, 0);
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
  }
  cerrarModalConfirmacion(): void {
    this.mostrarConfirmModal = false;
    this.limpiarDatosCliente();
  }
  abrirModalExito(): void {
    this.mostrarSuccessModal = true;
  }
  cerrarModalExito(): void {
    this.mostrarSuccessModal = false;
    this.router.navigate(['/home/listadoVentasStore']);
  }
  cerrarModales(): void {
    if (this.mostrarConfirmModal) this.cerrarModalConfirmacion();
    if (this.mostrarSuccessModal) this.cerrarModalExito();
  }

  obtenerMetodoDePago(valor: string) {
    this.metodoDePagoSeleccionado = valor;
    this.codigoMetodoPago = valor === 'QR' ? 1111 : 3333;
    this.formaPagoS.findById(this.codigoMetodoPago).subscribe({
      next: (Response) => {
        this.formaPago = Response.data;
      },
    });
  }

  filtrarClientes() {
    if (this.clienteNombreBuscador.length > 0) {
      const terminoBusqueda = this.clienteNombreBuscador.toLowerCase();
      this.clientesFiltrados = this.clienteExistes.filter(
        (cliente) =>
          cliente.ci.includes(terminoBusqueda) ||
          (cliente.razonSocial &&
            cliente.razonSocial.toLowerCase().includes(terminoBusqueda)),
      );
    } else {
      this.clientesFiltrados = [];
    }
  }

  buscadorCliente() {
    this.clienteS.findAll().subscribe({
      next: (Response) => {
        this.clienteExistes = Response.data;
      },
    });
  }

  volverAPreventa(): void {
    this.router.navigate(['/home/preVentasTienda']);
  }
}