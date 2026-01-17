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
import { direccionesEnvio } from '../../../models/PedidosEnviosDetalles/direccionesEnvio';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { DireccionEnvioService } from '../../../services/PedidosEnviosDetalles/direccion-envio-service.service';
import { StockDTO } from '../../../DTOs/Produc/StockDTO';
import { usuarios } from '../../../models/PersonModel/usuarios';
import { forma_pago } from '../../../models/PedidosEnviosDetalles/forma_pago';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';

declare var bootstrap: any;

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

  // Información del usuario
  usuarioInfo: usuarios | null = null;

  pedido: pedidos = {
    usuario: { username: '' } as usuarios,
    formaPago: { idFormaPago: 0 } as any,
    totalPedido: 0,
    estado: 'PENDIENTE',
    notas: '',
    detalles: [],
  };

  direccionEnvio: direccionesEnvio = {
    usuario: {
      username: '',
      passwordHash: '',
      email: '',
      persona: {
        ci: '',
        nombre: '',
        apellidop: '',
        apellidom: '',
        telefono: ''
      },
      rol: {
        nombreRol: ''
      }
    },
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

  envio: envios = {
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
    costoEnvio: 0,
  };

  seleccionMetodoPago: string = 'transferenciaBancaria';

  constructor(
    private carritoService: CarritoService,
    private PedidosS: PedidosService,
    private detallePedidoS: DetallePedidosService,
    private enviosS: EnviosService,
    private direccionEnvioS: DireccionEnvioService,
    private router: Router,
    private stockService: StockService,
    private usuariosService: UsuariosService
  ) {}

  ngOnInit(): void {
    this.cargarInformacionUsuario();
    this.cargarProductoCarrito();
  }

  // Método para cargar información del usuario usando findById
  cargarInformacionUsuario(): void {
    if (!this.username) {
      console.warn('No hay username en localStorage');
      return;
    }

    console.log('Cargando información del usuario:', this.username);
    
    this.usuariosService.findById(this.username).subscribe({
      next: (response: ApiResponse) => {
        console.log('Respuesta del servicio de usuario:', response);
        
        if (response.success && response.data) {
          this.usuarioInfo = response.data as usuarios;
          console.log('Información del usuario cargada:', this.usuarioInfo);
          this.autoCompletarFormulario();
        } else {
          console.error('Error en la respuesta del servicio:', response.message);
          this.autoCompletarFormulario();
        }
      },
      error: (error) => {
        console.error('Error al cargar información del usuario:', error);
        this.autoCompletarFormulario();
      }
    });
  }

  // Método para autocompletar el formulario con información del usuario
  autoCompletarFormulario(): void {
    setTimeout(() => {
      console.log('Autocompletando formulario con información del usuario...');
      
      // Obtener referencias a los inputs
      const nombreInput = document.getElementById('nombre') as HTMLInputElement;
      const apellidosInput = document.getElementById('apellidos') as HTMLInputElement;
      const direccionInput = document.getElementById('direccionCalle') as HTMLInputElement;
      const barrioInput = document.getElementById('barrio') as HTMLInputElement;
      const departamentoSelect = document.getElementById('departamento') as HTMLSelectElement;
      const telefonoInput = document.getElementById('whatsapp') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;

      // Autocompletar con información del usuario si está disponible
      if (this.usuarioInfo) {
        console.log('Usando información del usuario para autocompletar');
        
        // Nombre
        if (nombreInput && this.usuarioInfo.persona?.nombre) {
          nombreInput.value = this.usuarioInfo.persona.nombre;
        }

        // Apellidos
        if (apellidosInput) {
          apellidosInput.value = this.getApellidosCompletos();
        }

        // Email
        if (emailInput && this.usuarioInfo.email) {
          emailInput.value = this.usuarioInfo.email;
        }

        // Teléfono
        if (telefonoInput && this.usuarioInfo.persona?.telefono) {
          telefonoInput.value = this.usuarioInfo.persona.telefono;
        }

        // Dirección
        if (direccionInput && this.usuarioInfo.persona?.direccion) {
          direccionInput.value = this.usuarioInfo.persona.direccion;
        }

        // Departamento/Ciudad
        if (departamentoSelect && this.usuarioInfo.persona?.ciudad) {
          departamentoSelect.value = this.usuarioInfo.persona.ciudad;
        }

        // Barrio (si no hay campo específico en persona, se deja vacío)
        if (barrioInput) {
          // El barrio no está en la estructura del usuario, se deja vacío para que el usuario lo complete
          barrioInput.value = '';
        }
      }

      console.log('Formulario autocompletado exitosamente');
    }, 100);
  }

  // Método para obtener apellidos completos
  getApellidosCompletos(): string {
    if (!this.usuarioInfo?.persona) return '';
    
    const apellidos = [];
    if (this.usuarioInfo.persona.apellidop) {
      apellidos.push(this.usuarioInfo.persona.apellidop);
    }
    if (this.usuarioInfo.persona.apellidom) {
      apellidos.push(this.usuarioInfo.persona.apellidom);
    }
    
    return apellidos.join(' ');
  }

  cargarProductoCarrito(): void {
    this.isLoading = true;
    this.carritoService.listarProductosDeUsuario(this.username).subscribe({
      next: (response: ApiResponse) => {
        this.isLoading = false;
        if (response.success) {
          const rawDetalles: RawDetalleCarritoProducto[] =
            response.data as RawDetalleCarritoProducto[];

          this.detallesCarrito = rawDetalles.map(
            (item: RawDetalleCarritoProducto) => {
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

    this.ocultarMensajes();

    if (!this.detallesCarrito || this.detallesCarrito.length === 0) {
      this.mostrarError('No hay productos en el carrito');
      return;
    }

    const formData = this.obtenerDatosFormulario();
    if (!formData.esValido) {
      this.mostrarError(
        formData.mensajeError ||
          'Por favor, completa todos los campos obligatorios correctamente.'
      );
      return;
    }

    this.configurarObjetosPedido(formData);
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
    ) as HTMLSelectElement;
    const numeroTelefonoInput = document.getElementById(
      'whatsapp'
    ) as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const notasPedidoInput = document.getElementById(
      'notasPedido'
    ) as HTMLTextAreaElement;

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
          'El email es obligatorio y debe tener formato válido',
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

  private configurarObjetosPedido(formData: any): void {
    const idFormaPagoSeleccionada = this.seleecionadoMetodoPago();

    const detalles: detallePedido[] = this.detallesCarrito.map((item) => {
      const productoMinimo = { idProducto: item.stock.producto.idProducto };

      return {
        producto: productoMinimo as any,
        cantidad: item.cantidad,
        precioUnitario: parseFloat(item.precioUnitario),
        subtotal: parseFloat(item.subtotal),
      } as detallePedido;
    });

    this.pedido = {
      usuario: { username: this.username } as usuarios,
      formaPago: { 
        idFormaPago: idFormaPagoSeleccionada,
        nombre: this.seleccionMetodoPago === 'transferenciaBancaria' ? 'Pago por QR' : 'Pago en Entrega',
        descripcion: this.seleccionMetodoPago === 'transferenciaBancaria' ? 'Pago mediante código QR' : 'Pago al momento de la entrega'
      } as forma_pago,
      notas: formData.datos.notas,
      estado: 'PENDIENTE',
      totalPedido: this.totalCarrito,
      detalles: detalles,
    };

    this.direccionEnvio = {
      usuario: { username: this.username } as usuarios,
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

    this.envio = {
      pedido: this.pedido,
      direccionEnvio: this.direccionEnvio,
      metodoEnvio: { idMetodoEnvio: 1 } as any,
      nombreReceptor: formData.datos.nombre,
      apellidosReceptor: formData.datos.apellidos,
      telefonoReceptor: formData.datos.telefono,
      emailReceptor: formData.datos.email,
      empresaEnvio: 'Empresa de Envíos',
      notas: formData.datos.notas,
      estado: 'PENDIENTE',
      costoEnvio: 0
    };
  }

  private ejecutarSecuenciaGuardado(): void {
    this.isLoading = true;
    
    this.PedidosS.save(this.pedido)
      .pipe(
        switchMap((pedidoGuardado: ApiResponse) => {
          if (!pedidoGuardado.success || !pedidoGuardado.data) {
            throw new Error(
              'Error al guardar el pedido (incl. detalles): ' +
                pedidoGuardado.message
            );
          }

          const pedidoId = (pedidoGuardado.data as pedidos).idPedido;

          if (!pedidoId) {
            throw new Error('El ID del pedido guardado no fue retornado.');
          }

          this.pedido.idPedido = pedidoId;
          this.envio.pedido = { ...this.pedido, idPedido: pedidoId };

          console.log(
            `Pedido (y detalles) guardado con ID: ${pedidoId}. Procediendo con Stock y Envío.`
          );

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
                  return of({
                    success: false,
                    message: `Fallo de stock para ${item.stock.producto.idProducto}`,
                  });
                })
              );
          });

          const guardarEnvio$ = this.direccionEnvioS
            .save(this.direccionEnvio)
            .pipe(
              switchMap((direccionGuardada: ApiResponse) => {
                if (!direccionGuardada.success || !direccionGuardada.data) {
                  throw new Error(
                    'Error al guardar la dirección de envío: ' +
                      direccionGuardada.message
                  );
                }

                const direccionGuardadaObj =
                  direccionGuardada.data as direccionesEnvio;
                const direccionId = direccionGuardadaObj.idDireccionEnvio;

                if (!direccionId) {
                  throw new Error(
                    'El ID de la dirección guardada no fue retornado.'
                  );
                }

                this.envio.direccionEnvio = {
                  ...this.direccionEnvio,
                  idDireccionEnvio: direccionId,
                };

                console.log(
                  `Dirección de envío guardada con ID: ${direccionId}`
                );
                return this.enviosS.save(this.envio);
              })
            );

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
          console.error('Error durante la secuencia de registro del pedido:', err);
          
          console.error('Error completo:', {
            status: err.status,
            statusText: err.statusText,
            error: err.error,
            url: err.url
          });
          
          const errorMsg = err.error?.message || err.message || 'Ocurrió un error al procesar el pedido.';
          this.mostrarErrorModal(errorMsg);
        },
      });
  }

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

// Método para mostrar error
mostrarErrorModal(mensaje: string): void {
  this.errorMessage = mensaje;
  const modalElement = document.getElementById('modalError');
  if (modalElement) {
    const errorMessageElement = modalElement.querySelector('#errorMessageText');
    if (errorMessageElement) {
      errorMessageElement.textContent = mensaje;
    }
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

  validarEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  }

  onPaymentMethodChange(methodId: string): void {
    this.seleccionMetodoPago = methodId;
  }

  seleecionadoMetodoPago(): number {
    const metodosPago: { [key: string]: number } = {
      'transferenciaBancaria': 3333,
      'pagoEntrega': 1111
    };
    
    const idSeleccionado = metodosPago[this.seleccionMetodoPago];
    
    if (!idSeleccionado) {
      console.error('ID de forma de pago no encontrado para:', this.seleccionMetodoPago);
      return 1111;
    }
    
    return idSeleccionado;
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
  // Método para mostrar modal de éxito
mostrarModalExito(): void {
  const modalElement = document.getElementById('modalExito');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Redirigir al home cuando se cierre el modal
    modalElement.addEventListener('hidden.bs.modal', () => {
      this.router.navigate(['/home']);
    }, { once: true });
  }
}



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

  getNombreProducto(item: DetalleCarritoProducto): string {
    return item.stock.producto.nombre;
  }


}