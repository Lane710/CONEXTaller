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
import { stock } from '../../../models/ProductoStockModel/stock';
import { DetallePedidosService } from '../../../services/PedidosEnviosDetalles/detalle-pedidos.service';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
import { direccionesEnvio } from '../../../models/PedidosEnviosDetalles/direccionesEnvio';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { DireccionEnvioService } from '../../../services/PedidosEnviosDetalles/direccion-envio-service.service';
declare var bootstrap: any;

@Component({
  selector: 'app-datos-cliente',
  standalone: true, // Asegúrate de que esto está en true
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

  pedido: pedidos = {
    // Variable para guardar los datos del pedido
    username: '',
    formaPago: { idFormaPago: 0, nombre: '' },
    totalPedido: 0, // Agregado totalPedido aquí
    estado: 'PENDIENTE',
    notas: '',
  };

  envio: envios = {
    direccionEnvio: {
      idDireccionEnvio: 0,
      username: '',
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
    },

    nombreReceptor: '',
    apellidosReceptor: '',
    telefonoReceptor: '',
    emailReceptor: '',
    empresaEnvio: '',
    notas: '',
  };

  direccionEnvio: direccionesEnvio = {
    username: '',
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
    this.carritoService.listarProductosDeUsuario(this.username).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          const rawDetalles: RawDetalleCarritoProducto[] =
            response.data as RawDetalleCarritoProducto[];
          this.detallesCarrito = rawDetalles.map(
            (item: RawDetalleCarritoProducto) => {
              return {
                ...item,
                // CORRECCIÓN: Convierte el objeto Decimal a string para coincidir con el DTO
                precioUnitario: new Decimal(item.precioUnitario).toString(),
                subtotal: new Decimal(item.subtotal).toString(),
                producto: {
                  ...item.producto,
                  // CORRECCIÓN: Tu ProductoDTO espera un 'number' en 'precio', por lo que convertimos
                  precio: new Decimal(item.producto.precio).toNumber(),
                },
              };
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
        }
      },
      error: (error) => {
        console.error('Error en la solicitud HTTP al listar productos:', error);
        this.detallesCarrito = [];
        this.calcularTotales();
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

  DatosDelCLiente() {
    // 1. Oculta cualquier mensaje de error previo
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }

    // 2. Extrae y valida los valores del formulario (código omitido para brevedad, asumiendo que funciona)
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

    // 3. Realiza la validación de los campos obligatorios
    if (
      !inputNombre.value ||
      !apellidosInput.value ||
      !direccionCalleInput.value ||
      !barrioInput.value ||
      !departamentoInput.value ||
      !numeroTelefonoInput.value ||
      !this.validarEmail(emailInput.value)
    ) {
      this.mesagesErrores(
        'Por favor, completa todos los campos obligatorios correctamente.',
        null
      );
      return;
    }

    // 4. Configurar los objetos de pedido, dirección y envío
    const idFormaPagoSeleccionada = this.seleecionadoMetodoPago();

    this.pedido = {
      username: this.username,
      formaPago: { idFormaPago: idFormaPagoSeleccionada },
      notas: notasPedidoInput.value,
      estado: 'PENDIENTE',
      totalPedido: this.totalCarrito, // Se asigna el total calculado del carrito aquí
    };

    this.direccionEnvio = {
      username: this.username,
      nombreDestinatario: inputNombre.value,
      apellidosDestinatario: apellidosInput.value,
      direccion: direccionCalleInput.value,
      barrio: barrioInput.value,
      ciudad: 'Cercado',
      provinciaEstado: departamentoInput.value,
      codigoPostal: '0000',
      pais: paisRegionInput.value,
      numeroTelefono: numeroTelefonoInput.value,
      emailDestinatario: emailInput.value,
    };

    this.envio = {
      pedido: this.pedido, // Se asignará después de guardar el pedido
      direccionEnvio: undefined,
      metodoEnvio: { idMetodoEnvio: 1 }, // Ejemplo de método de envío
      nombreReceptor: inputNombre.value,
      apellidosReceptor: apellidosInput.value,
      telefonoReceptor: numeroTelefonoInput.value,
      emailReceptor: emailInput.value,
      empresaEnvio: 'falta',
      notas: notasPedidoInput.value,
      estado: 'EN_TRANSITO',
    };

    // 5. Encadenar las llamadas de forma secuencial
    this.PedidosS.save(this.pedido)
      .pipe(
        // 1. Guardar el pedido y obtener su ID
        switchMap((pedidoGuardado: ApiResponse) => {
          if (!pedidoGuardado.success || !pedidoGuardado.data) {
            throw new Error('Error al guardar el pedido principal.');
          }
          this.pedido.idPedido = pedidoGuardado.data as number;
          this.envio.pedido = this.pedido; // Asigna el ID del pedido al objeto de envío
          console.log(`Pedido guardado con ID: ${this.pedido.idPedido}`);

          // 2. Guardar la dirección de envío
          return this.direccionEnvioS.save(this.direccionEnvio);
        }),
        // 3. Guardar el envío
        switchMap((direccionGuardada: ApiResponse) => {
          if (!direccionGuardada.success || !direccionGuardada.data) {
            throw new Error('Error al guardar la dirección de envío.');
          }
          this.envio.direccionEnvio = direccionGuardada.data;
          console.log(
            `Dirección de envío guardada con ID: ${this.envio.direccionEnvio}`
          );
          return this.enviosS.save(this.envio);
        }),
        // 4. Guardar los detalles del pedido y actualizar el stock
        switchMap((envioGuardado: ApiResponse) => {
          if (!envioGuardado.success || !envioGuardado.data) {
            throw new Error('Error al guardar el envío.');
          }
          console.log(`Envío guardado con ID: ${envioGuardado.data}`);

          const operacionesDetalleYStock = this.detallesCarrito.map((item) => {
            const nuevoDetallePedido: detallePedido = {
              pedido: this.pedido, // Usamos solo el ID del pedido
              producto: item.producto,
              cantidad: item.cantidad,
              precioUnitario: parseFloat(item.precioUnitario), // Convierte la cadena a un número
              subtotal: parseFloat(item.subtotal),
            };

            return this.detallePedidoS.save(nuevoDetallePedido).pipe(
              switchMap(() => {
                // Actualizar el stock
                return this.stockService
                  .StockDelProducto(item.producto.idProducto)
                  .pipe(
                    switchMap((stockResponse: ApiResponse) => {
                      if (stockResponse.success) {
                        const idStock = stockResponse.data;
                        const cantidadVendida = item.cantidad;
                        return this.stockService.addorRestarStockProductos(
                          idStock,
                          -cantidadVendida
                        );
                      }
                      return of(null); // Retornar un observable para que forkJoin no falle
                    })
                  );
              })
            );
          });
          return forkJoin(operacionesDetalleYStock);
        })
      )
      .subscribe({
        next: (responses) => {
          console.log(
            'Todas las operaciones de pedido, envío, detalles y stock fueron exitosas.',
            responses
          );
          this.limpiarCarrito();
          this.redireccionarMetodoPago();
        },
        error: (err: HttpErrorResponse) => {
          console.error(
            'Error durante la secuencia de registro del pedido:',
            err
          );
          this.mesagesErrores(
            'Ocurrió un error al procesar el pedido. Por favor, inténtelo de nuevo.',
            err
          );
        },
      });
  }

  // Los demás métodos (validarEmail, mesagesErrores, onPaymentMethodChange, etc.) se mantienen igual.

  //Registro exitoso se redirege dependiendo del metodo de pago
  redireccionarMetodoPago(): void {
    if (this.seleccionMetodoPago === 'transferenciaBancaria') {
      // Redirigir a la página de transferencia bancaria, incluyendo los datos
      const datosParaOtraPagina = {
        totalCarrito: this.totalCarrito,
      };
      this.router.navigate(['/home/pedidoOnline/pagoQR'], {
        state: { datosDelPedido: datosParaOtraPagina },
      });
    } else if (this.seleccionMetodoPago === 'pagoEntrega') {
      this.mostrarModalExito();
    }
  }

  validarEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    return emailRegex.test(email);
  }

  mesagesErrores(error: string, err: any): void {
    console.log('Error:', error, err);
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      errorContainer.textContent = error;
      errorContainer.style.display = 'block';
    } else {
      console.error('No se encontró el contenedor de errores.');
    }
  }

  onPaymentMethodChange(methodId: string): void {
    this.seleccionMetodoPago = methodId;
  }

  seleecionadoMetodoPago(): number {
    let metodoPago = 1111;
    if (this.seleccionMetodoPago === 'transferenciaBancaria') {
      metodoPago = 1111;
    } else if (this.seleccionMetodoPago === 'pagoEntrega') {
      metodoPago = 2222;
    }
    return metodoPago;
  }

  limpiarCarrito(): void {
    this.productosCarrio.forEach((iten) => {
      this.carritoService
        .eliminarProductoDeCarrito(this.username, iten.idDetalleCarrito)
        .subscribe({
          error: (err) =>
            console.error('Error al eliminar producto del carrito:', err),
        });
    });
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
}
