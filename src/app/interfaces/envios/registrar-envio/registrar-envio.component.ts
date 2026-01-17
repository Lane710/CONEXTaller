import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { ventas } from '../../../models/Ventas/ventas';
import { usuarios } from '../../../models/PersonModel/usuarios';
import { VentasService } from '../../../services/ventasTienda/ventas.service';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { ApiResponse } from '../../../models/api-response';
import { direccionesEnvio } from '../../../models/PedidosEnviosDetalles/direccionesEnvio';
// Importamos el modelo para metodoEnvio
import { metodoEnvio } from '../../../models/PedidosEnviosDetalles/metodosEnvio';
import { DireccionEnvioService } from '../../../services/PedidosEnviosDetalles/direccion-envio-service.service';

declare var bootstrap: any;

@Component({
  selector: 'app-registrar-envio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-envio.component.html',
  styleUrls: ['./registrar-envio.component.css']
})
export class RegistrarEnvioComponent implements OnInit, AfterViewInit {

  ciudadesTarija: string[] = [
    'Cercado (Tarija)', 'Yacuiba', 'Villa Montes', 'Bermejo',
    'Entre Ríos', 'Padcaya', 'San Lorenzo', 'Uriondo'
  ];
  
  todayDate: string = '';

  // --- CORRECCIÓN 1: Usar el modelo real y cargar los datos de prueba ---
  // (Idealmente, esto vendría de un servicio como te mostré antes)
  metodosEnvio: metodoEnvio[] = [
    { idMetodoEnvio: 1, nombre: 'Envío Estándar', costo: 15.00 },
    { idMetodoEnvio: 2, nombre: 'Envío Express', costo: 40.00 },
    { idMetodoEnvio: 3, nombre: 'Recojo en Tienda', costo: 0.00 }
  ];

  envio: envios = {
    nombreReceptor: '',
    apellidosReceptor: '',
    telefonoReceptor: '', 
    venta: undefined,
    pedido: undefined,
    direccionEnvio: {
      nombreDestinatario: '',
      apellidosDestinatario: '',
      direccion: '',
      barrio: '',
      ciudad: 'Cercado (Tarija)',
      provinciaEstado: 'Tarija',
      codigoPostal: '0000',
      pais: 'Bolivia',
      usuario: {}
    },
    metodoEnvio: {}, // <-- CORRECCIÓN: Iniciar como 'undefined' para que el <select> funcione
    empresaEnvio: 'FedEx',
    costoEnvio: 0,
    fechaEntregaEstimada: '',
    notas: '',
    estado: 'PENDIENTE',
    
  };

  origenEnvio: string = '';
  idOrigen: number | undefined;
  isLoading: boolean = false;

  @ViewChild('responseModal') responseModalElement!: ElementRef;
  responseModal: any;
  modalTitle: string = '';
  modalMessage: string = '';
  isModalSuccess: boolean = false;
  redirectToList: boolean = false;

  constructor(
    private enviosService: EnviosService,
    private router: Router,
    private route: ActivatedRoute,
    private ventasService: VentasService,
    private direccionesEnvioService: DireccionEnvioService
  ) {}

  ngOnInit(): void {
    this.todayDate = new Date().toISOString().split('T')[0];
    // NOTA: Aquí deberías llamar al servicio que carga los métodos de envío
    // this.cargarMetodosEnvio();

    this.route.params.subscribe(params => {
      const idVentaParam = params['idVenta'];
      if (idVentaParam) {
        this.origenEnvio = 'Venta';
        this.idOrigen = +idVentaParam;
        this.envio.venta = { idVenta: this.idOrigen } as ventas;
        this.envio.pedido = undefined;
        this.cargarDatosVenta(this.idOrigen);
      } else {
        console.error('Error: No se encontró un idVenta en la ruta.');
        this.showResponseModal(false, 'Error de Carga', 'No se pudo identificar el origen del envío.');
      }
    });
  }

  cargarDatosVenta(idVenta: number): void {
    // ... (este método está bien, sin cambios)
    this.isLoading = true;
    this.ventasService.findById(idVenta).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const ventaData: ventas = response.data;
          
        } else {
          this.showResponseModal(false, 'Error al Cargar Datos', response.message || 'No se encontraron datos para la venta.');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos de la venta:', error);
        this.isLoading = false;
        this.showResponseModal(false, 'Error de Conexión', 'No se pudieron cargar los datos de la venta.');
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.responseModalElement) {
      this.responseModal = new bootstrap.Modal(this.responseModalElement.nativeElement, {
        keyboard: false, backdrop: 'static'
      });
    }
  }

  // --- CORRECCIÓN 2: Método para actualizar el costo ---
  onMetodoEnvioChange(): void {
    if (this.envio.metodoEnvio && this.envio.metodoEnvio.costo !== undefined) {
      this.envio.costoEnvio = this.envio.metodoEnvio.costo;
    } else {
      this.envio.costoEnvio = 0;
    }
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      Object.keys(form.controls).forEach(field => {
        form.controls[field].markAsTouched({ onlySelf: true });
      });
      console.warn('Formulario inválido');
      return;
    }
    // ... (resto de validaciones)
    this.isLoading = true;

    // ... (preparación de datos de dirección)
    const username = localStorage.getItem('current_username');
    if (username && this.envio.direccionEnvio) {
      this.envio.direccionEnvio.usuario = { username: username } as usuarios;
    }
    this.envio.direccionEnvio!.nombreDestinatario = this.envio.nombreReceptor;
    this.envio.direccionEnvio!.apellidosDestinatario = this.envio.apellidosReceptor;
    this.envio.direccionEnvio!.numeroTelefono = this.envio.telefonoReceptor || '';
    this.envio.direccionEnvio!.emailDestinatario = this.envio.emailReceptor || '';
    this.envio.estado = 'PENDIENTE';

    console.log('Guardando dirección de envío:', this.envio.direccionEnvio);

    // --- PASO 1: Guardar dirección de envío ---
    this.direccionesEnvioService.save(this.envio.direccionEnvio!).subscribe({
      next: (responseDir:ApiResponse) => {
        if (responseDir.success && responseDir.data) {
          const nuevaDireccion = responseDir.data;
          console.log('Dirección registrada con éxito:', nuevaDireccion);

          // --- PASO 2: Preparar el objeto de envío FINAL ---
          
          // Guardamos el ID del método seleccionado
          const selectedMetodoId = this.envio.metodoEnvio?.idMetodoEnvio;

          // Creamos el objeto final que se enviará
          const envioParaGuardar: envios = {
            ...this.envio,
            // Aplanamos la dirección de envío a solo el ID
            direccionEnvio: { idDireccionEnvio: nuevaDireccion.idDireccionEnvio } as direccionesEnvio,
            // --- ¡CORRECCIÓN 3: ESTA ES LA CLAVE! ---
            // Aplanamos el método de envío a solo el ID
            metodoEnvio: { idMetodoEnvio: selectedMetodoId, nombre: 'nose', costo:0 }
          };

          // Nos aseguramos de que el 'idVenta' esté en el objeto final
          if(this.idOrigen) {
            envioParaGuardar.venta = { idVenta: this.idOrigen } as ventas;
            envioParaGuardar.pedido = undefined;
          }

          console.log('Registrando envío con objeto final transformado:', JSON.stringify(envioParaGuardar, null, 2));

          // --- PASO 3: Guardar envío ---
          this.enviosService.save(envioParaGuardar).subscribe({
            next: (responseEnvio) => {
              console.log('Envío registrado con éxito:', responseEnvio);
              this.isLoading = false;
              this.redirectToList = true;
              this.showResponseModal(true, 'Registro Exitoso', `El envío para la ${this.origenEnvio} ha sido registrado correctamente.`);
            },
            error: (errorEnvio) => {
              console.error('Error al registrar el envío:', errorEnvio);
              this.isLoading = false;
              // Mensaje de error mejorado
              const backendErrorMessage = errorEnvio.error?.message || errorEnvio.message || 'Error al registrar el envío.';
              this.showResponseModal(false, 'Error de Registro', backendErrorMessage);
            }
          });
        } else {
          // ... (manejo de error de dirección)
        }
      },
      error: (errorDir) => {
        // ... (manejo de error de dirección)
      }
    });
  }
  onCancel(): void {
    this.router.navigate(['/home/envios/list-envios']);
  }

  showResponseModal(success: boolean, title: string, message: string): void {
    this.isModalSuccess = success;
    this.modalTitle = title;
    this.modalMessage = message;
    if (this.responseModal) {
      this.responseModal.show();
    }
  }

  closeResponseModalAndRedirect(): void {
    if (this.responseModal) {
      this.responseModal.hide();
      if (this.isModalSuccess && this.redirectToList) {
        setTimeout(() => {
          this.router.navigate(['/home/envios/list-envios']);
        }, 500);
      }
    }
  }
}