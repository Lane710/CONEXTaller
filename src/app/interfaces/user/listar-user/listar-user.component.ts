import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Asegúrate de que RouterLink esté aquí
import { forkJoin } from 'rxjs';

import { usuarios } from '../../../models/usuarios';
import { UsuariosService } from '../../../services/usuarios.service';
import { personas } from '../../../models/personas';
import { PersonasService } from '../../../services/personas.service';

declare var bootstrap: any;

@Component({
  selector: 'app-listar-usuarios',
  standalone: true,
  imports: [CommonModule, NgIf, NgClass, RouterLink], // Agrega RouterLink aquí
  templateUrl: './listar-user.component.html',
  styleUrl: './listar-user.component.css',
})
export class ListarUserComponent implements OnInit, AfterViewInit {
  usuarios: usuarios[] = [];
  personas: personas[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  @ViewChild('confirmarAccionUsuarioModal') confirmarAccionUsuarioModalRef!: ElementRef;
  private confirmarAccionUsuarioModal: any;
  usuarioSeleccionado: usuarios | null = null;

  // --- Propiedades para el modal de mensaje general ---
  showModal: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];
  isSuccessModal: boolean = false;
  // ----------------------------------------------------

  // --- Propiedades para la paginación ---
  currentPage: number = 1;
  itemsPerPage: number = 10; // Puedes ajustar este valor según tus necesidades
  totalPages: number = 0;
  paginatedUsers: usuarios[] = [];
  // ------------------------------------

  // --- Propiedades para el modal de detalles de usuario ---
  @ViewChild('modalDetallesUsuarioRef') modalDetallesUsuarioRef!: ElementRef;
  private modalDetallesUsuario: any;
  // -------------------------------------------------------

  constructor(private usuariosService: UsuariosService, private router: Router, private personasService: PersonasService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    // Inicializa el modal de confirmación
    if (this.confirmarAccionUsuarioModalRef) {
      this.confirmarAccionUsuarioModal = new bootstrap.Modal(this.confirmarAccionUsuarioModalRef.nativeElement);
    }
    // Inicializa el modal de detalles de usuario
    if (this.modalDetallesUsuarioRef) {
      this.modalDetallesUsuario = new bootstrap.Modal(this.modalDetallesUsuarioRef.nativeElement);
    }
  }

  /**
   * Muestra un modal de mensaje general.
   * @param title El título del modal.
   * @param message El mensaje principal.
   * @param isSuccess Indica si es un mensaje de éxito o error.
   * @param details Detalles adicionales (opcional).
   */
  showModalMessage(title: string, message: string, isSuccess: boolean, details: string[] = []): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isSuccessModal = isSuccess;
    this.modalDetails = details;
    this.showModal = true;
  }

  /**
   * Cierra el modal de mensaje general.
   */
  closeModal(): void {
    this.showModal = false;
    this.modalDetails = [];
  }

  /**
   * Carga todos los datos necesarios (usuarios y personas) utilizando forkJoin
   * para manejar múltiples peticiones asíncronas de manera concurrente.
   */
  loadAllData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      users: this.usuariosService.findAll(),
      people: this.personasService.findAll(),
    }).subscribe({
      next: (results) => {
        if (results.users && results.users.data) {
          this.usuarios = results.users.data as usuarios[];
          console.log('Usuarios cargados:', this.usuarios);
          this.calculatePagination(); // Calcular paginación después de cargar usuarios
        } else {
          this.errorMessage = results.users?.message || 'Error desconocido al cargar usuarios.';
          console.error('Error al cargar usuarios:', this.errorMessage);
          this.showModalMessage('Error', this.errorMessage, false);
        }

        if (results.people && results.people.data) {
          this.personas = results.people.data as personas[];
          console.log('Personas cargadas:', this.personas);
        } else {
          console.error('Error al cargar las personas:', results.people?.message || 'Error desconocido');
          this.showModalMessage('Advertencia', 'No se pudieron cargar todas las personas.', false, [results.people?.message || '']);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage =
          'Error de conexión al cargar datos. Asegúrate de que el backend esté corriendo en http://localhost:8080: ' +
          err.message;
        this.isLoading = false;
        console.error('Error al obtener datos combinados:', err);
        this.showModalMessage('Error Crítico', this.errorMessage, false);
      },
    });
  }

  /**
   * Calcula la paginación y actualiza los usuarios paginados.
   */
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.usuarios.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.usuarios.slice(startIndex, endIndex);
  }

  /**
   * Cambia a la página especificada.
   * @param pageNumber El número de página a la que ir.
   */
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
      this.calculatePagination();
    }
  }

  /**
   * Función auxiliar para obtener los datos de la persona por su CI (idPersona).
   * @param idPersona El CI de la persona a buscar.
   * @returns El objeto 'personas' si se encuentra, de lo contrario 'undefined'.
   */
  getPersonaForUser(idPersona: string): personas | undefined {
    return this.personas.find((p) => p.ci === idPersona);
  }

  /**
   * Navega a la vista de gestión de roles para un usuario específico.
   * Guarda el username en localStorage antes de navegar.
   * @param username El nombre de usuario del cual se gestionarán los roles.
   */
  verRolesUsuario(username: string | undefined): void {
    if (username === undefined) {
      console.error('No se puede navegar a la gestión de roles sin un nombre de usuario.');
      this.showModalMessage('Error de Navegación', 'No se proporcionó un nombre de usuario para gestionar roles.', false);
      return;
    }
    localStorage.setItem('usuario_actual', username);
    this.router.navigate(['/home/rolesUsuario', username]);
  }

  /**
   * Navega a la interfaz de modificación de usuario para un usuario específico.
   * Guarda el username en localStorage y luego navega.
   * @param username El nombre de usuario a modificar.
   */
  goToModifyUser(username: string | undefined): void {
    if (username === undefined) {
      console.error('No se puede navegar a la modificación sin un nombre de usuario.');
      this.showModalMessage('Error de Navegación', 'No se proporcionó un nombre de usuario para modificar.', false);
      return;
    }

    localStorage.setItem('ModUser', username);
    this.router.navigate(['/home/modificarUser']);
  }

  /**
   * Abre el modal de confirmación para una acción sobre el usuario.
   * @param user El usuario seleccionado para la acción.
   */
  abrirModalConfirmacionUsuario(user: usuarios): void {
    this.usuarioSeleccionado = user;
    this.confirmarAccionUsuarioModal?.show();
  }

  /**
   * Confirma la acción de habilitar/deshabilitar el usuario seleccionado.
   */
  confirmarAccionUsuario(): void {
    if (this.usuarioSeleccionado && this.usuarioSeleccionado.username !== undefined) {
      const usernameToToggle = this.usuarioSeleccionado.username;
      const estadoActual = this.usuarioSeleccionado.estado;

      console.log(`Confirmada acción para usuario: ${usernameToToggle}, estado actual: ${estadoActual}`);

      this.usuariosService.toggleUserStatus(usernameToToggle).subscribe({
        next: (response) => {
          if (response.success) {
            console.log(
              `Estado del usuario ${usernameToToggle} ${
                estadoActual === 1 ? 'deshabilitado' : 'habilitado'
              } con éxito.`,
            );
            this.confirmarAccionUsuarioModal?.hide();
            this.loadAllData();
            this.showModalMessage('Éxito', response.message || 'Estado del usuario cambiado con éxito.', true);
          } else {
            console.error('Error al cambiar el estado del usuario:', response.message);
            this.showModalMessage('Error', response.message || 'Error al cambiar el estado del usuario.', false);
          }
        },
        error: (err) => {
          console.error('Error en la comunicación al cambiar el estado del usuario:', err);
          this.showModalMessage('Error de Conexión', 'Error de comunicación al cambiar el estado del usuario.', false, [err.message || 'Error desconocido']);
        },
      });
    } else {
      console.warn('No se ha seleccionado ningún usuario para la acción de confirmación.');
      this.showModalMessage('Advertencia', 'No se ha seleccionado ningún usuario para la acción de confirmación.', false);
    }
  }

  /**
   * Abre el modal de detalles del usuario.
   * @param user El usuario cuyos detalles se mostrarán.
   */
  verDetallesUsuario(user: usuarios): void {
    this.usuarioSeleccionado = user;
    this.modalDetallesUsuario?.show();
  }

  /**
   * Cierra el modal de detalles del usuario.
   */
  closeDetallesUsuarioModal(): void {
    this.modalDetallesUsuario?.hide();
  }

  /**
   * Getter para controlar la visibilidad del modal backdrop.
   */
  isModalDetallesUsuarioShown(): boolean {
    return this.modalDetallesUsuario?._isShown || false;
  }
}
