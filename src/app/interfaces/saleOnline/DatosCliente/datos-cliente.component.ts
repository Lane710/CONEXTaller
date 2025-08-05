import { Component, OnInit } from '@angular/core';
import { ApiResponse } from '../../../models/api-response';
import { RawDetalleCarritoProducto } from '../../../DTOs/Cart/ProductoEnCarrito';
import Decimal from 'decimal.js';
import { DetalleCarritoProducto } from '../../../DTOs/Cart/DetalleCarritoProducto';
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { NgFor, NgIf } from '@angular/common';
import { PedidosService } from '../../../services/PedidosEnviosDetalles/pedidos.service';
import { ReturnStatement } from '@angular/compiler';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { detallePedido } from '../../../models/PedidosEnviosDetalles/detallePedido';
import { stock } from '../../../models/ProductoStockModel/stock';
import { DetallePedidosService } from '../../../services/PedidosEnviosDetalles/detalle-pedidos.service';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { DetalleEnviosService } from '../../../services/PedidosEnviosDetalles/detalle-envios.service';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
import { direccionesEnvio } from '../../../models/PedidosEnviosDetalles/direccionesEnvio';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-datos-cliente',
  imports: [NgFor, NgIf],
  templateUrl: './datos-cliente.component.html',
  styleUrl: './datos-cliente.component.css',
})
export class DatosClienteComponent implements OnInit {
  //Variables Globales
  username: string = localStorage.getItem('current_username') || '';
  detallesCarrito: DetalleCarritoProducto[] = [];
  subtotalCarrito: string = '0.00'; // Inicializa como string
  totalCarrito: string = '0.00'; // Inicializa como string
  productosCarrio: DetalleCarritoProducto[] = [];
  pedido: pedidos = {
    //variable para guardar los datos pedido
    username: '',
    idFormaPago: 0,
  };
  detallePedido: detallePedido = {
    pedido: this.pedido,
    cantidad: 0,
    precioUnitario: '',
    subtotal: '',
  };
  envio: envios = {
    idPedido: 0,
    idDireccionEnvio: undefined,
    idMetodoEnvio: 0,
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
  seleccionMetodoPago: string = 'transferenciaBancaria'; // Para el control de los radio buttons

  //cONSTRUCTOR
  constructor(
    private carritoService: CarritoService,
    private PedidosS: PedidosService,
    private detallePedidoS: DetallePedidosService,
    private enviosS: EnviosService,
    private direccionEnvioS: DetalleEnviosService
  ) {}

  ngOnInit(): void {
    this.cargarProductoCarrito();
  }
// Aquí puedes agregar métodos para manejar los datos del cliente, como guardar cambios, etc.
  cargarProductoCarrito(): void {
    console.log(`Cargando datos del cliente para el usuario: ${this.username}`);
    this.carritoService.listarProductosDeUsuario(this.username).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
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
  calcularTotales(): void {
    let subtotalCalculado = new Decimal(0);

    this.detallesCarrito.forEach((item) => {
      // Suma los subtotales. item.subtotal es un string, lo convertimos a Decimal para la suma.
      subtotalCalculado = subtotalCalculado.plus(new Decimal(item.subtotal));
    });

    this.subtotalCarrito = subtotalCalculado.toString(); // Almacena el resultado como string
    this.totalCarrito = subtotalCalculado.toString(); // Asumiendo envío gratis por ahora, también como string
  }

  //Recuperar datos del pedido para el cliente
  DatosDelCLiente() {
    //Sacar los datos del cliente poara el envio y pedido
    let inputNombre = document.getElementById('nombre') as HTMLInputElement;
    let apellidosInput = document.getElementById(
      'apellidos'
    ) as HTMLInputElement;
    let paisRegionInput = document.getElementById(
      'paisRegion'
    ) as HTMLInputElement;
    let direccionCalleInput = document.getElementById(
      'direccionCalle'
    ) as HTMLInputElement;
    let barrioInput = document.getElementById('barrio') as HTMLInputElement;
    let ciudadProvinciaInput = document.getElementById(
      'ciudadProvincia'
    ) as HTMLInputElement;
    let departamentoInput = document.getElementById(
      'departamento'
    ) as HTMLInputElement;
    let numeroTelefonoInput = document.getElementById(
      'whatsapp'
    ) as HTMLInputElement;
    let emailInput = document.getElementById('email') as HTMLInputElement;
    let notasPedidoInput = document.getElementById(
      'notasPedido'
    ) as HTMLTextAreaElement;

    //Sacar el tipo de pago que selecciona el cliente

    //sacar los datos del pedido
    const datosDelPedido = {
      nombre: inputNombre.value,
      apellidos: apellidosInput.value,
      paisRegion: paisRegionInput.value,
      direccionCalle: direccionCalleInput.value,
      barrio: barrioInput.value,
      ciudadProvincia: ciudadProvinciaInput.value,
      departamento: departamentoInput.value,
      numeroTelefonico: numeroTelefonoInput.value,
      email: emailInput.value,
      notasPedido: notasPedidoInput.value,
      idFormaPago: this.seleecionadoMetodoPago(),
    };

    //guardado del pedido
    this.pedido = {
      username: this.username,
      idFormaPago: datosDelPedido.idFormaPago,
      notas: datosDelPedido.notasPedido,
      estado: 'pendiente',
    };
    //datos de envio
    this.envio = {
      idMetodoEnvio: 1, // Asigna el valor adecuado según tu lógica
      nombreReceptor: inputNombre.value,
      apellidosReceptor: apellidosInput.value,
      telefonoReceptor: numeroTelefonoInput.value,
      emailReceptor: emailInput.value,
      empresaEnvio: 'falta', // Asigna el valor adecuado si tienes este dato
      notas: notasPedidoInput.value,
    };
    //captura de datos de direccion envio
    this.direccionEnvio = {
      username: this.username,
      nombreDestinatario: inputNombre.value,
      apellidosDestinatario: apellidosInput.value,
      direccion: direccionCalleInput.value,
      barrio: barrioInput.value,
      ciudad: ciudadProvinciaInput.value,
      provinciaEstado: departamentoInput.value,
      codigoPostal: '0000', // Puedes agregar otro input si tienes este dato
      pais: paisRegionInput.value,
      numeroTelefono: numeroTelefonoInput.value,
      emailDestinatario: emailInput.value,
    };
    //guardado del pedido
    this.PedidosS.save(this.pedido).subscribe({
      next: (pedidoGuardado: ApiResponse) => {
        this.pedido.idPedido = pedidoGuardado.data;
        //registro de los detalles del pedidos
        this.carritoService.listarProductosDeUsuario(this.username).subscribe({
          next: (productoCarrio: ApiResponse) => {
            this.productosCarrio = productoCarrio.data;
            console.log(this.productosCarrio);
            for (const stock of this.productosCarrio) {
              const nuevoDetallePedido: detallePedido = {
                pedido: this.pedido,
                producto: stock.producto,
                cantidad: stock.cantidad, // o la cantidad real del carrito
                precioUnitario: stock.precioUnitario,
                subtotal: stock.subtotal,
              };
              console.log(nuevoDetallePedido);
              this.detallePedidoS.save(nuevoDetallePedido).subscribe({
                next: (response: ApiResponse) => {
                  console.log(response.data);
                },
                error: (err: HttpErrorResponse) => {
                  console.log(
                    'error en el resgistro del detalle del pedido',
                    err
                  );
                  this.mesagesErrores(
                    'Fallo al realizar el guardado del detalle del Pedido vuelve a intentarlo',
                    err
                  );
                },
              });
            }
          },
          error: (err: HttpErrorResponse) => {
            console.log('error en el listado del carrito', err);
            this.mesagesErrores(
              'Fallo en el listado de los productos de su carrito, regrese al carrito',
              err
            );
          },
        });

        this.direccionEnvioS.save(this.direccionEnvio).subscribe({
          next: (guardadoDireccionE: ApiResponse) => {
            console.log('direccion de envio', guardadoDireccionE.data);
            this.envio.idDireccionEnvio = guardadoDireccionE.data;
            this.envio.idPedido = pedidoGuardado.data;
            this.enviosS.save(this.envio).subscribe({
              next: (response: ApiResponse) => {
                const form = document.querySelector(
                  '.datos-cliente-form'
                ) as HTMLFormElement;
                if (form) {
                  form.reset(); // Limpia todos los campos del formulario
                }
                //eliminacion de los productos del carrito
                this.limpiarCarrito();
              },
              error: (err: HttpErrorResponse) => {
                console.log('error en el resgistro del envio', err);
                this.mesagesErrores(
                  'Fallo al realizar el guardado del Envio vuelve a intentarlo',
                  err
                );
              },
            });
          },
          error: (err: HttpErrorResponse) => {
            console.log('error en el resgistro de la direccion de  envio', err);
            this.mesagesErrores(
              'Fallo al realizar el guardado de la direccion del Envio vuelve a intentarlo',
              err
            );
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        console.log('error en el resgistro del pedido', err);
        this.mesagesErrores(
          'Fallo al realizar el guardado del Pedido vuelve a intentarlo',
          err
        );
      },
    });
  }

  mesagesErrores(error: string, err: any): void {
    console.log('error en el resgistro del pedido', err);
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      // 1. Inyecta el mensaje de error en el div
      (errorContainer.textContent = error),
        // 2. Haz que el div sea visible
        (errorContainer.style.display = 'block');
    } else {
      console.error('No se encontró el contenedor de errores.');
    }
  }

  //seleecion del metodo de pago para mostrar sus detalle y informacion
  /**
   * Actualiza el método de pago seleccionado.
   * Este método se llama desde el HTML cuando se selecciona un radio button.
   * @param methodId El ID del método de pago que se ha seleccionado.
   */
  onPaymentMethodChange(methodId: string): void {
    this.seleccionMetodoPago = methodId;
  }

  //metodo de pago seleccionado
  seleecionadoMetodoPago(): number {
    console.log('Método de pago seleccionado:', this.seleccionMetodoPago);
    let metodoPago = 1111;
    if (this.seleccionMetodoPago === 'transferenciaBancaria') {
      metodoPago = 1111;
    } else if (this.seleccionMetodoPago === 'pagarTarjetaCredito') {
      metodoPago = 2222;
    } else if (this.seleccionMetodoPago === 'pagoEntrega') {
      metodoPago = 3333;
    }
    console.log(metodoPago);
    return metodoPago;
  }

  //eliminar los productos del carrio por que ya se guardo el pedido y envio
  limpiarCarrito():void{
    const productos=this.productosCarrio;

    for(let iten of productos){
this.carritoService.eliminarProductoDeCarrito(this.username,iten.idDetalleCarrito).subscribe({
      next:(respuesta:ApiResponse)=>{

      }
    })
    }
    
  }
}
