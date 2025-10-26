import { Component, OnInit } from '@angular/core';
import { ApiResponse } from '../../../models/api-response';
import { RawDetalleCarritoProducto } from '../../../DTOs/Cart/ProductoEnCarrito';
import Decimal from 'decimal.js';
import { DetalleCarritoProducto } from '../../../DTOs/Cart/DetalleCarritoProducto';
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { NgFor, NgIf } from '@angular/common';
import { PedidosService } from '../../../services/PedidosEnviosDetalles/pedidos.service';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { detallePedido } from '../../../models/PedidosEnviosDetalles/detallePedido';
import { DetallePedidosService } from '../../../services/PedidosEnviosDetalles/detalle-pedidos.service';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
// ASUMO que 'direccionesEnvio' ahora es la interfaz DTO con el campo 'username' simple.
import { direccionesEnvio } from '../../../models/PedidosEnviosDetalles/direccionesEnvio';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { DireccionEnvioService } from '../../../services/PedidosEnviosDetalles/direccion-envio-service.service';
import { StockDTO } from '../../../DTOs/Produc/StockDTO';
import { usuarios } from '../../../models/PersonModel/usuarios';

declare var bootstrap: any;

// ❌ ELIMINADAS: UsuarioMinimo, ProductoParaDetallePedido, y PedidoConDetallesYUsuario.
// Usaremos directamente 'pedidos' y 'usuarios'.

@Component({
  selector: 'app-datos-cliente',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './datos-cliente.component.html',
  styleUrl: './datos-cliente.component.css',
})
export class DatosClienteComponent implements OnInit {
  // Variables Globales
  username: string = localStorage.getItem('current_username') || '';
  detallesCarrito: DetalleCarritoProducto[] = [];
  subtotalCarrito: string = '0.00';
  totalCarrito = 0.0;
  productosCarrio: DetalleCarritoProducto[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Inicialización del objeto 'pedido' (requiere usuario anidado en esta entidad)
  pedido: pedidos = {
    // Mínima estructura del objeto 'usuarios' para enviar el username
    usuario: { username: '' } as usuarios,
    formaPago: { idFormaPago: 0 } as any, // Mínima estructura de forma_pago
    totalPedido: 0,
    estado: 'PENDIENTE',
    notas: '',
    detalles: [], // Propiedad 'detalles' incluida en la interfaz 'pedidos'
  };

  // ✅ CORRECCIÓN: Inicialización de 'direccionEnvio' - Usa la estructura DTO simple con `username`
  direccionEnvio: direccionesEnvio = {
    usuario: {
      username: '',
      passwordHash: '',
      email: '',
      persona: {
        ci: '',
        nombre: '',
        apellidop: '',
        apellidom: ''
      },
      rol: {
        nombreRol: ''
      }
    }, // Este es el campo clave para el DTO
    nombreDestinatario: '',
    apellidosDestinatario: '',
    direccion: '',
    barrio: '',
    ciudad: '',
    provinciaEstado: '',
    codigoPostal: '',
    pais: '',
    numeroTelefono: '',
    emailDestinatario: '',
  };
 
  // Inicialización de 'envio'
  envio: envios = {
    // Usa el objeto 'direccionEnvio' inicializado arriba
    direccionEnvio: this.direccionEnvio,
    pedido: this.pedido,
    metodoEnvio: { idMetodoEnvio: 1 } as any,
    nombreReceptor: '',
    apellidosReceptor: '',
    telefonoReceptor: '',
    emailReceptor: '',
    empresaEnvio: 'Empresa de Envíos',
    notas: '',
    estado: 'PENDIENTE',
  };

  seleccionMetodoPago: string = 'transferenciaBancaria';

  constructor(
    private carritoService: CarritoService,
    private PedidosS: PedidosService,
    private detallePedidoS: DetallePedidosService,
    private enviosS: EnviosService,
    private direccionEnvioS: DireccionEnvioService,
    private router: Router,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.cargarProductoCarrito();
  }

  cargarProductoCarrito(): void {
    this.isLoading = true;
    this.carritoService.listarProductosDeUsuario(this.username).subscribe({
      next: (response: ApiResponse) => {
        this.isLoading = false;
        if (response.success) {
          const rawDetalles: RawDetalleCarritoProducto[] =
            response.data as RawDetalleCarritoProducto[];

          // Mapeo correcto incluyendo la propiedad stock
          this.detallesCarrito = rawDetalles.map(
            (item: RawDetalleCarritoProducto) => {
              // Crear el objeto StockDTO
              const stockDTO: StockDTO = {
                idStock: item.stock.idStock,
                cantidad: item.stock.cantidad,
                producto: {
                  idProducto: item.stock.producto.idProducto,
                  nombre: item.stock.producto.nombre,
                  descripcion: item.stock.producto.descripcion,
                  precio: new Decimal(item.stock.producto.precio).toNumber(),
                  sku: item.stock.producto.sku,
                  codigoBarras: item.stock.producto.codigoBarras,
                  marca: item.stock.producto.marca,
                  color: item.stock.producto.color,
                  estado: item.stock.producto.estado,
                  imagen: item.stock.producto.imagen,
                  disponibleOnline: item.stock.producto.disponibleOnline,
                  categoria: item.stock.producto.categoria,
                  subcategoria: item.stock.producto.subcategoria,
                  proveedor: item.stock.producto.proveedor,
                  usuarioRegistro: item.stock.producto.usuarioRegistro,
                  tipo: item.stock.producto.tipo,
                  variante: item.stock.producto.variante,
                  fechaRegistro: item.stock.producto.fechaRegistro,
                  ultimaActualizacion: item.stock.producto.ultimaActualizacion,
                  precioCompra: item.stock.producto.precioCompra
                },
              };

              return {
                idDetalleCarrito: item.idDetalleCarrito,
                cantidad: item.cantidad,
                precioUnitario: new Decimal(item.precioUnitario).toString(),
                subtotal: new Decimal(item.subtotal).toString(),
                stock: stockDTO,
              } as DetalleCarritoProducto;
            }
          );

          this.productosCarrio = [...this.detallesCarrito];
          this.calcularTotales();
        } else {
          console.error(
            'Error al listar productos del carrito:',
            response.message
          );
          this.detallesCarrito = [];
          this.calcularTotales();
          this.mostrarError('Error al cargar los productos del carrito');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error en la solicitud HTTP al listar productos:', error);
        this.detallesCarrito = [];
        this.calcularTotales();
        this.mostrarError('Error de conexión al cargar el carrito');
      },
    });
  }

  calcularTotales(): void {
    let subtotalCalculado = new Decimal(0);
    this.detallesCarrito.forEach((item) => {
      subtotalCalculado = subtotalCalculado.plus(new Decimal(item.subtotal));
    });
    this.subtotalCarrito = subtotalCalculado.toString();
    this.totalCarrito = subtotalCalculado.toNumber();
  }

  DatosDelCLiente(): void {
    if (this.isLoading) return;

    // Ocultar mensajes previos
    this.ocultarMensajes();

    // Validar que hay productos en el carrito
    if (!this.detallesCarrito || this.detallesCarrito.length === 0) {
      this.mostrarError('No hay productos en el carrito');
      return;
    }

    // Obtener y validar datos del formulario
    const formData = this.obtenerDatosFormulario();
    if (!formData.esValido) {
      this.mostrarError(
        formData.mensajeError ||
          'Por favor, completa todos los campos obligatorios correctamente.'
      );
      return;
    }

    // Configurar objetos
    this.configurarObjetosPedido(formData);

    // Ejecutar secuencia de guardado
    this.ejecutarSecuenciaGuardado();
  }

  private obtenerDatosFormulario(): {
    esValido: boolean;
    mensajeError?: string;
    datos?: any;
  } {
    const inputNombre = document.getElementById('nombre') as HTMLInputElement;
    const apellidosInput = document.getElementById(
      'apellidos'
    ) as HTMLInputElement;
    const paisRegionInput = document.getElementById(
      'paisRegion'
    ) as HTMLInputElement;
    const direccionCalleInput = document.getElementById(
      'direccionCalle'
    ) as HTMLInputElement;
    const barrioInput = document.getElementById('barrio') as HTMLInputElement;
    const departamentoInput = document.getElementById(
      'departamento'
    ) as HTMLInputElement;
    const numeroTelefonoInput = document.getElementById(
      'whatsapp'
    ) as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const notasPedidoInput = document.getElementById(
      'notasPedido'
    ) as HTMLTextAreaElement;

    // Validar campos obligatorios
    if (!inputNombre?.value?.trim()) {
      return { esValido: false, mensajeError: 'El nombre es obligatorio' };
    }
    if (!apellidosInput?.value?.trim()) {
      return {
        esValido: false,
        mensajeError: 'Los apellidos son obligatorios',
      };
    }
    if (!direccionCalleInput?.value?.trim()) {
      return { esValido: false, mensajeError: 'La dirección es obligatoria' };
    }
    if (!barrioInput?.value?.trim()) {
      return { esValido: false, mensajeError: 'El barrio es obligatorio' };
    }
    if (!departamentoInput?.value?.trim()) {
      return {
        esValido: false,
        mensajeError: 'El departamento es obligatorio',
      };
    }
    if (!numeroTelefonoInput?.value?.trim()) {
      return {
        esValido: false,
        mensajeError: 'El número de teléfono es obligatorio',
      };
    }
    if (!emailInput?.value?.trim() || !this.validarEmail(emailInput.value)) {
      return {
        esValido: false,
        mensajeError:
          'El email es obligatorio y debe tener formato válido (@gmail.com)',
      };
    }

    return {
      esValido: true,
      datos: {
        nombre: inputNombre.value.trim(),
        apellidos: apellidosInput.value.trim(),
        pais: paisRegionInput?.value?.trim() || 'Bolivia',
        direccion: direccionCalleInput.value.trim(),
        barrio: barrioInput.value.trim(),
        departamento: departamentoInput.value.trim(),
        telefono: numeroTelefonoInput.value.trim(),
        email: emailInput.value.trim(),
        notas: notasPedidoInput?.value?.trim() || '',
      },
    };
  }

  /**
   * MODIFICADO: Configura el objeto Pedido (con Detalles anidados)
   * Y configura la Dirección de Envío como DTO simple (con username en la raíz).
   */
  private configurarObjetosPedido(formData: any): void {
    const idFormaPagoSeleccionada = this.seleecionadoMetodoPago();

    // 1. Construir la lista de detalles para el objeto 'pedido'
    const detalles: detallePedido[] = this.detallesCarrito.map((item) => {
      // Solo necesitamos enviar el idProducto dentro del objeto producto
      const productoMinimo = { idProducto: item.stock.producto.idProducto };

      return {
        producto: productoMinimo as any,
        cantidad: item.cantidad,
        precioUnitario: parseFloat(item.precioUnitario),
        subtotal: parseFloat(item.subtotal),
      } as detallePedido;
    });

    // 2. Configurar el objeto PEDIDO COMPLETO (Estructura de entidad JPA)
    this.pedido = {
      // Correcto: El pedido necesita el objeto usuario ANIDADO.
      usuario: { username: this.username } as usuarios,
      formaPago: { idFormaPago: idFormaPagoSeleccionada } as any,
      notas: formData.datos.notas,
      estado: 'PENDIENTE',
      totalPedido: this.totalCarrito,
      detalles: detalles, // Incluir los detalles aquí
    };

    // 3. Configurar Dirección de Envío (CORRECCIÓN CLAVE: Estructura DTO simple)
    this.direccionEnvio = {
      // ✅ CORREGIDO: Usamos la propiedad simple 'username'
      usuario:{ username:this.username}as usuarios,
      nombreDestinatario: formData.datos.nombre,
      apellidosDestinatario: formData.datos.apellidos,
      direccion: formData.datos.direccion,
      barrio: formData.datos.barrio,
      ciudad: 'Cercado',
      provinciaEstado: formData.datos.departamento,
      codigoPostal: '0000',
      pais: formData.datos.pais,
      numeroTelefono: formData.datos.telefono,
      emailDestinatario: formData.datos.email,
    };

    // 4. Configurar el Envío (Necesita las referencias actualizadas)
    this.envio = {
      pedido: this.pedido,
      direccionEnvio: this.direccionEnvio, // Usa el DTO simple
      metodoEnvio: { idMetodoEnvio: 1 } as any,
      nombreReceptor: formData.datos.nombre,
      apellidosReceptor: formData.datos.apellidos,
      telefonoReceptor: formData.datos.telefono,
      emailReceptor: formData.datos.email,
      empresaEnvio: 'Empresa de Envíos',
      notas: formData.datos.notas,
      estado: 'PENDIENTE',
    };
  }

  /**
   * Secuencia de guardado con la corrección de la anidación del usuario.
   */
  private ejecutarSecuenciaGuardado(): void {
    this.isLoading = true;

    // 1. Guardar el Pedido (incluye los detalles y formaPago por cascada en el backend)
    this.PedidosS.save(this.pedido)
      .pipe(
        switchMap((pedidoGuardado: ApiResponse) => {
          if (!pedidoGuardado.success || !pedidoGuardado.data) {
            // Error de llave foránea o similar al guardar el pedido/detalles
            throw new Error(
              'Error al guardar el pedido (incl. detalles): ' +
                pedidoGuardado.message
            );
          }

          // Obtener el ID del Pedido guardado
          const pedidoId = (pedidoGuardado.data as pedidos).idPedido;

          if (!pedidoId) {
            throw new Error('El ID del pedido guardado no fue retornado.');
          }

          // Actualizar las referencias
          this.pedido.idPedido = pedidoId;
          this.envio.pedido = { ...this.pedido, idPedido: pedidoId };

          console.log(
            `Pedido (y detalles) guardado con ID: ${pedidoId}. Procediendo con Stock y Envío.`
          );

          // 2. Preparar la actualización de Stock (N llamadas paralelas)
          const stockUpdates = this.detallesCarrito.map((item) => {
            const idStock = item.stock.idStock;
            const cantidadVendida = item.cantidad;

            return this.stockService
              .addorRestarStockProductos(idStock, -cantidadVendida)
              .pipe(
                catchError((error) => {
                  console.error(
                    `Error al actualizar stock para Producto ${item.stock.producto.idProducto}:`,
                    error
                  );
                  // Devolvemos un Observable que no falla la operación completa, solo registra el error
                  return of({
                    success: false,
                    message: `Fallo de stock para ${item.stock.producto.idProducto}`,
                  });
                })
              );
          });

          // 3. Preparar el Guardado de Dirección de Envío y luego el Envío (secuencial)
          const guardarEnvio$ = this.direccionEnvioS
            .save(this.direccionEnvio) // Aquí se envía el DTO simple
            .pipe(
              switchMap((direccionGuardada: ApiResponse) => {
                if (!direccionGuardada.success || !direccionGuardada.data) {
                  throw new Error(
                    'Error al guardar la dirección de envío: ' +
                      direccionGuardada.message
                  );
                }

                // Obtener el ID de la Dirección guardada
                const direccionGuardadaObj =
                  direccionGuardada.data as direccionesEnvio;
                const direccionId = direccionGuardadaObj.idDireccionEnvio;

                if (!direccionId) {
                  throw new Error(
                    'El ID de la dirección guardada no fue retornado.'
                  );
                }

                // Actualizar la referencia del Envío con el ID de la Dirección
                this.envio.direccionEnvio = {
                  ...this.direccionEnvio,
                  idDireccionEnvio: direccionId,
                };

                console.log(
                  `Dirección de envío guardada con ID: ${direccionId}`
                );
                return this.enviosS.save(this.envio); // Guardar Envío
              })
            );

          // 4. Ejecutar actualizaciones de stock Y el guardado de la dirección/envío en paralelo
          return forkJoin([...stockUpdates, guardarEnvio$]);
        })
      )
      .subscribe({
        next: (responses) => {
          this.isLoading = false;
          console.log(
            'Todas las operaciones (pedido, detalles, stock, envío) completadas.',
            responses
          );
          this.limpiarCarrito();
          this.redireccionarMetodoPago();
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          console.error(
            'Error durante la secuencia de registro del pedido:',
            err
          );
          // Esto capturará errores de red, o el error explícito lanzado por throw new Error()
          const errorMsg =
            err.error?.message ||
            err.message ||
            'Ocurrió un error al procesar el pedido. Por favor, inténtelo de nuevo.';
          this.mostrarErrorModal(errorMsg);
        },
      });
  }

  // Métodos de utilidad
  private ocultarMensajes(): void {
    this.errorMessage = '';
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
  }

  private mostrarError(mensaje: string): void {
    this.errorMessage = mensaje;
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      errorContainer.textContent = mensaje;
      errorContainer.style.display = 'block';
    }
  }

  private mostrarErrorModal(mensaje: string): void {
    this.errorMessage = mensaje;
    const modalElement = document.getElementById('modalError');
    if (modalElement) {
      const modalBody = modalElement.querySelector('.modal-body');
      if (modalBody) {
        modalBody.innerHTML = `
<p>${mensaje}</p>
<p>Si el problema persiste, contacta con soporte técnico.</p>
`;
      }
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // Métodos públicos
  validarEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    return emailRegex.test(email);
  }

  onPaymentMethodChange(methodId: string): void {
    this.seleccionMetodoPago = methodId;
  }

  seleecionadoMetodoPago(): number {
    // Asegúrate de que estos IDs (1111/2222) son válidos en tu tabla 'FormaPago'
    return this.seleccionMetodoPago === 'transferenciaBancaria' ? 1111 : 2222;
  }

  limpiarCarrito(): void {
    if (this.productosCarrio.length === 0) return;

    const operacionesEliminacion = this.productosCarrio.map((item) =>
      this.carritoService.eliminarProductoDeCarrito(
        this.username,
        item.idDetalleCarrito
      )
    );

    forkJoin(operacionesEliminacion).subscribe({
      next: () => {
        console.log('Carrito limpiado exitosamente');
        this.detallesCarrito = [];
        this.productosCarrio = [];
        this.calcularTotales();
      },
      error: (err) => {
        console.error('Error al limpiar el carrito:', err);
      },
    });
  }

  redireccionarMetodoPago(): void {
    if (this.seleccionMetodoPago === 'transferenciaBancaria') {
      const datosParaOtraPagina = {
        totalCarrito: this.totalCarrito,
        pedido: this.pedido,
      };
      this.router.navigate(['/home/pedidoOnline/pagoQR'], {
        state: { datosDelPedido: datosParaOtraPagina },
      });
    } else if (this.seleccionMetodoPago === 'pagoEntrega') {
      this.mostrarModalExito();
    }
  }

  mostrarModalExito(): void {
    const modalElement = document.getElementById('modalExito');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      modalElement.addEventListener(
        'hidden.bs.modal',
        () => {
          this.router.navigate(['/home']);
        },
        { once: true }
      );
    }
  }

  // Métodos para la vista
  hayProductosEnCarrito(): boolean {
    return this.detallesCarrito && this.detallesCarrito.length > 0;
  }

  getTotalProductos(): number {
    return this.detallesCarrito.reduce(
      (total, item) => total + item.cantidad,
      0
    );
  }

  hayStockSuficiente(item: DetalleCarritoProducto): boolean {
    return item.stock.cantidad >= item.cantidad;
  }

  // Método para mostrar el nombre del producto en el template
  getNombreProducto(item: DetalleCarritoProducto): string {
    return item.stock.producto.nombre;
  }
}
