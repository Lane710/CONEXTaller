import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { ApiResponse } from '../../../models/api-response';
import { DireccionEnvioService } from '../../../services/PedidosEnviosDetalles/direccion-envio-service.service';


declare var bootstrap: any;

@Component({
  selector: 'app-modificar-envio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modificar-envio.component.html',
  styleUrls: ['./modificar-envio.component.css']
})
export class ModificarEnvioComponent implements OnInit, AfterViewInit {

  ciudadesTarija: string[] = [
    'Cercado', 'Yacuiba', 'Villa Montes', 'Bermejo',
    'Entre Ríos', 'Padcaya', 'San Lorenzo', 'Uriondo'
  ];
  
  todayDate: string = '';
  
  envio: envios | undefined;
  idEnvio: number | undefined;

  isLoading: boolean = true;
  isSaving: boolean = false;

  @ViewChild('responseModal') responseModalElement!: ElementRef;
  responseModal: any;
  modalTitle: string = '';
  modalMessage: string = '';
  isModalSuccess: boolean = false;

  constructor(
    private enviosService: EnviosService,
    private router: Router,
    private route: ActivatedRoute,
    private direccionesEnvioService: DireccionEnvioService
  ) {}

  ngOnInit(): void {
    this.todayDate = new Date().toISOString().split('T')[0];

    this.route.params.subscribe(params => {
      const idEnvioParam = params['idEnvio']; 
      if (idEnvioParam) {
        this.idEnvio = +idEnvioParam;
        this.cargarDatosEnvio(this.idEnvio);
      } else {
        console.error('Error: No se encontró un idEnvio en la ruta.');
        this.isLoading = false;
        this.showResponseModal(false, 'Error de Carga', 'No se pudo identificar el envío a modificar.');
      }
    });
  }

  cargarDatosEnvio(id: number): void {
    this.isLoading = true;
    
    // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
    // Usamos el nuevo método findById para buscar el envío por su propio ID.
    this.enviosService.findById(id).subscribe({
      next: (response:ApiResponse) => {
        if (response.success && response.data) {
          this.envio = response.data;
          if (!this.envio?.direccionEnvio?.ciudad) {
            this.envio!.direccionEnvio!.ciudad = 'Cercado (Tarija)';
          }
          console.log('Datos del envío cargados:', this.envio);
        } else {
          this.showResponseModal(false, 'Error al Cargar Datos', response.message || 'No se encontraron datos para el envío.');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del envío:', error);
        this.isLoading = false;
        this.showResponseModal(false, 'Error de Conexión', 'No se pudieron cargar los datos del envío.');
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

  onSubmit(form: NgForm): void {
    if (form.invalid || !this.envio || !this.envio.direccionEnvio || !this.envio.idEnvio) {
      Object.keys(form.controls).forEach(field => {
        form.controls[field].markAsTouched({ onlySelf: true });
      });
      console.warn('Formulario inválido o datos de envío incompletos.');
      return;
    }

    this.isSaving = true;
    const dirId = this.envio.direccionEnvio.idDireccionEnvio;
    const envioId = this.envio.idEnvio;

    // La lógica de `update` ahora coincide con los servicios corregidos.
    this.direccionesEnvioService.update(dirId!, this.envio.direccionEnvio).subscribe({
      next: (responseDir) => {
        if (responseDir.success) {
          console.log('Dirección actualizada con éxito');

          const envioUpdatePayload = {
            nombreReceptor: this.envio!.nombreReceptor,
            apellidosReceptor: this.envio!.apellidosReceptor,
            telefonoReceptor: this.envio!.telefonoReceptor,
            emailReceptor: this.envio!.emailReceptor,
            empresaEnvio: this.envio!.empresaEnvio,
            fechaEntregaEstimada: this.envio!.fechaEntregaEstimada,
            notas: this.envio!.notas
          };

          this.enviosService.update(envioId, envioUpdatePayload).subscribe({
            next: (responseEnvio) => {
              console.log('Envío actualizado con éxito:', responseEnvio);
              this.isSaving = false;
              this.showResponseModal(true, 'Actualización Exitosa', 'El envío ha sido modificado correctamente.');
            },
            error: (errorEnvio) => {
              console.error('Error al actualizar el envío:', errorEnvio);
              this.isSaving = false;
              const msg = errorEnvio.error?.message || 'Error al guardar los cambios del envío.';
              this.showResponseModal(false, 'Error al Guardar', msg);
            }
          });
        } else {
          this.isSaving = false;
          this.showResponseModal(false, 'Error al Guardar', responseDir.message || 'No se pudo actualizar la dirección de envío.');
        }
      },
      error: (errorDir) => {
        console.error('Error al actualizar la dirección:', errorDir);
        this.isSaving = false;
        const msg = errorDir.error?.message || 'Error al guardar la dirección.';
        this.showResponseModal(false, 'Error de Conexión', msg);
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
      if (this.isModalSuccess) {
        setTimeout(() => {
          this.router.navigate(['/home/envios/list-envios']);
        }, 500);
      }
    }
  }
}
