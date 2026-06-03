import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { usuarios } from '../../../models/PersonModel/usuarios';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { personas } from '../../../models/PersonModel/personas';
import { PersonasService } from '../../../services/PersonServis/personas.service';
import { ApiResponse } from '../../../models/api-response';

declare var bootstrap: any;

@Component({
  selector: 'app-listar-usuarios',
  standalone: true,
  imports: [CommonModule, NgIf, NgClass, FormsModule],
  templateUrl: './listar-user.component.html',
  styleUrl: './listar-user.component.css',
})
export class ListarUserComponent implements OnInit, AfterViewInit {
  // Listas de datos
  allUsers: usuarios[] = [];
  filteredUsers: usuarios[] = [];
  personas: personas[] = [];
usuarioLogueado: string = '';
  // Propiedades de estado de la UI
  isLoading: boolean = false;
  errorMessage: string | null = null;
  usuarioSeleccionado: usuarios | null = null;

  // Propiedades para los filtros
  searchTerm: string = '';
  filterStatus: 'todos' | 'activo' | 'inactivo' = 'todos';
  filterRole: string = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente';

  // Nueva propiedad para el rol seleccionado
  nuevoRolSeleccionado: string = '';

  // Modal de confirmación (deshabilitar/habilitar)
  @ViewChild('confirmarAccionUsuarioModal')
  confirmarAccionUsuarioModalRef!: ElementRef;
  private confirmarAccionUsuarioModal: any;

  // Modal de cambiar rol
  @ViewChild('cambiarRolUsuarioModal') cambiarRolUsuarioModalRef!: ElementRef;
  private cambiarRolUsuarioModal: any;

  // Modal de detalles
  @ViewChild('modalDetallesUsuarioRef') modalDetallesUsuarioRef!: ElementRef;
  private modalDetallesUsuario: any;

  // Modal de éxito para cambio de estado
  @ViewChild('modalExitoEstado') modalExitoEstadoRef!: ElementRef;
  private modalExitoEstado: any;

  // Modal de mensaje general
  showModal: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];
  isSuccessModal: boolean = false;

  // Propiedades para la paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private personasService: PersonasService
  ) {}

  ngOnInit(): void {
   this.usuarioLogueado = localStorage.getItem('current_username') || ''; 
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    if (this.confirmarAccionUsuarioModalRef) {
      this.confirmarAccionUsuarioModal = new bootstrap.Modal(
        this.confirmarAccionUsuarioModalRef.nativeElement
      );
    }
    if (this.cambiarRolUsuarioModalRef) {
      this.cambiarRolUsuarioModal = new bootstrap.Modal(
        this.cambiarRolUsuarioModalRef.nativeElement
      );
    }
    if (this.modalDetallesUsuarioRef) {
      this.modalDetallesUsuario = new bootstrap.Modal(
        this.modalDetallesUsuarioRef.nativeElement
      );
    }
    if (this.modalExitoEstadoRef) {
      this.modalExitoEstado = new bootstrap.Modal(
        this.modalExitoEstadoRef.nativeElement
      );
    }
  }

  /**
   * Carga todos los datos necesarios (usuarios y personas).
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
          this.allUsers = results.users.data as usuarios[];
        } else {
          this.errorMessage =
            results.users?.message || 'Error desconocido al cargar usuarios.';
          this.showModalMessage('Error', this.errorMessage, false);
        }

        if (results.people && results.people.data) {
          this.personas = results.people.data as personas[];
        } else {
          this.showModalMessage(
            'Advertencia',
            'No se pudieron cargar todas las personas.',
            false,
            [results.people?.message || '']
          );
        }
        this.isLoading = false;
        this.applyFiltersAndSort(); // Aplicar filtros después de cargar datos
      },
      error: (err) => {
        this.errorMessage =
          'Error de conexión al cargar datos. Asegúrate de que el backend esté corriendo en http://localhost:8080: ' +
          err.message;
        this.isLoading = false;
        this.showModalMessage('Error Crítico', this.errorMessage, false);
      },
    });
  }

  /**
   * Aplica los filtros y el ordenamiento a la lista de usuarios.
   */
 /**
   * Aplica los filtros y el ordenamiento a la lista de usuarios.
   */
  applyFiltersAndSort(): void {
    let tempUsers = [...this.allUsers]; // Siempre empezar con TODOS los usuarios

    // 1. Filtrado por término de búsqueda (nombre o usuario)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      tempUsers = tempUsers.filter((user) => {
        const persona = this.getPersonaForUser(user.persona.ci);
        const fullName = `${persona?.nombre || ''} ${
          persona?.apellidop || ''
        } ${persona?.apellidom || ''}`.toLowerCase();
        return (
          user.username.toLowerCase().includes(term) || fullName.includes(term)
        );
      });
    }

    // 2. Filtrado por estado
    if (this.filterStatus !== 'todos') {
      const estado = this.filterStatus === 'activo' ? 1 : 0;
      tempUsers = tempUsers.filter((user) => user.estado === estado);
    }

    // 3. Filtrado por rol
    if (this.filterRole !== 'todos') {
      tempUsers = tempUsers.filter(
        (user) => user.rol.nombreRol === this.filterRole
      );
    }

    // 🔥 4. Ordenamiento por fecha de creación (Fecha + Hora EXACTA) 🔥
    tempUsers.sort((a, b) => {
      // Tomamos la fecha del backend, si no existe usamos la fecha origen de Unix
      // Si la fechaRegistro es un objeto Date en el backend, Angular podría recibirlo como string.
      let rawDateA = a.fechaCreacion ? String(a.fechaCreacion) : '1970-01-01T00:00:00';
      let rawDateB = b.fechaCreacion ? String(b.fechaCreacion) : '1970-01-01T00:00:00';

      // Si el formato viene con espacio (ej: '2024-04-08 17:00:00'), reemplazamos el espacio por 'T'
      if (rawDateA.includes(' ') && !rawDateA.includes('T')) {
        rawDateA = rawDateA.replace(' ', 'T');
      }
      if (rawDateB.includes(' ') && !rawDateB.includes('T')) {
        rawDateB = rawDateB.replace(' ', 'T');
      }

      // Convertimos a milisegundos
      const timeA = new Date(rawDateA).getTime();
      const timeB = new Date(rawDateB).getTime();

      // Aplicar dirección del orden: 
      // 'reciente' (Descendente) = Mayor a menor
      return this.sortDirection === 'reciente' ? timeB - timeA : timeA - timeB;
    });

    this.filteredUsers = tempUsers; // Actualizar la lista filtrada completa
    this.currentPage = 1; // Reiniciar paginación
    this.calculatePagination();
  }

  /**
   * Maneja el cambio en cualquier filtro.
   */
  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  /**
   * Obtiene los usuarios de la página actual.
   */
  get paginatedUsers(): usuarios[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  /**
   * Calcula la paginación y actualiza los usuarios paginados.
   */
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  /**
   * Cambia a la página especificada.
   * @param pageNumber El número de página a la que ir.
   */
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
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
   * @param username El nombre de usuario del cual se gestionarán los roles.
   */
  verRolesUsuario(username: string | undefined): void {
    if (username) {
      localStorage.setItem('usuario_actual', username);
      this.router.navigate(['/home/rolesUsuario', username]);
    } else {
      this.showModalMessage(
        'Error de Navegación',
        'No se proporcionó un nombre de usuario para gestionar roles.',
        false
      );
    }
  }

  /**
   * Navega a la interfaz de modificación de usuario para un usuario específico.
   * @param username El nombre de usuario a modificar.
   */
  goToModifyUser(username: string | undefined): void {
    if (username) {
      localStorage.setItem('ModUser', username);
      this.router.navigate(['/home/modificarUser']);
    } else {
      this.showModalMessage(
        'Error de Navegación',
        'No se proporcionó un nombre de usuario para modificar.',
        false
      );
    }
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
    if (this.usuarioSeleccionado && this.usuarioSeleccionado.username) {
      const usernameToToggle = this.usuarioSeleccionado.username;
      const estadoActual = this.usuarioSeleccionado.estado;

      this.usuariosService.toggleUserStatus(usernameToToggle).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            // Cerrar modal de confirmación
            this.confirmarAccionUsuarioModal?.hide();

            // Mostrar modal de éxito
            this.mostrarModalExito(estadoActual || 0, 'estado');

            // Actualizar el estado local del usuario
            this.usuarioSeleccionado!.estado = estadoActual === 1 ? 0 : 1;

            // Actualizar la lista filtrada
            this.actualizarListaUsuarios();
          } else {
            this.showModalMessage(
              'Error',
              response.message || 'Error al cambiar el estado del usuario.',
              false
            );
          }
        },
        error: (err) => {
          this.showModalMessage(
            'Error de Conexión',
            'Error de comunicación al cambiar el estado del usuario.',
            false,
            [err.message || 'Error desconocido']
          );
        },
      });
    } else {
      this.showModalMessage(
        'Advertencia',
        'No se ha seleccionado ningún usuario para la acción de confirmación.',
        false
      );
    }
  }

  // ===== NUEVOS MÉTODOS PARA CAMBIAR ROL =====

  /**
   * Abre el modal para cambiar el rol del usuario
   * @param user El usuario seleccionado
   */
 abrirModalCambiarRol(user: usuarios): void {
    // 1. PRIMERO validamos que no sea el mismo usuario
    if (user.username === this.usuarioLogueado) {
      this.showModalMessage(
        'Acción denegada', 
        'Por razones de seguridad, no puedes modificar tu propio rol.', 
        false
      );
      return; // Detiene la ejecución aquí
    }

    // 2. SI PASA la validación, entonces preparamos los datos y abrimos el modal
    this.usuarioSeleccionado = user;
    this.nuevoRolSeleccionado = '';
    this.cambiarRolUsuarioModal?.show();
  }

  /**
   * Confirma el cambio de rol del usuario
   */ // En tu listar-user.component.ts
  confirmarCambioRol(): void {
    if (!this.usuarioSeleccionado || !this.nuevoRolSeleccionado) {
      this.showModalMessage(
        'Advertencia',
        'Debe seleccionar un nuevo rol para continuar.',
        false
      );
      return;
    }

    const username = this.usuarioSeleccionado.username;
    let newRoleId: number;

    // 🔄 Convertir el nombre del rol seleccionado a su ID
    switch (this.nuevoRolSeleccionado.toLowerCase()) {
      case 'cliente':
        newRoleId = 1;
        break;
      case 'duena':
      case 'dueña':
        newRoleId = 2;
        break;
      case 'administrador':
        newRoleId = 3;
        break;
      case 'trabajador':
        newRoleId = 4;
        break;
      default:
        this.showModalMessage('Error', 'Rol seleccionado no válido.', false);
        return;
    }

    // 🚀 Llamar al servicio de actualización
    this.usuariosService.updateUserRole(username, newRoleId).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          // Cerrar el modal
          this.cambiarRolUsuarioModal?.hide();

          // Mostrar mensaje de éxito
          this.mostrarModalExito(0, 'rol');

          // 🧭 Actualizar los datos del usuario localmente
          this.usuarioSeleccionado!.rol.idRol = newRoleId;
          this.usuarioSeleccionado!.rol.nombreRol = this.nuevoRolSeleccionado;

          // Limpiar selección
          this.nuevoRolSeleccionado = '';
          this.usuarioSeleccionado = null;

          // Refrescar la lista
          this.actualizarListaUsuarios();
        } else {
          this.showModalMessage(
            'Error',
            response.message || 'Error al cambiar el rol del usuario.',
            false
          );
        }
      },
      error: (err) => {
        console.error('Error al cambiar el rol:', err);
        this.showModalMessage(
          'Error de Conexión',
          'No se pudo comunicar con el servidor para cambiar el rol del usuario.',
          false,
          [err.message || 'Error desconocido']
        );
      },
    });
  }

  /**
   * Muestra el modal de éxito con mensaje personalizado.
   * @param estadoAnterior El estado anterior del usuario (1 para activo, 0 para inactivo) - solo para cambios de estado
   * @param tipo El tipo de operación: 'estado' o 'rol'
   */ /**
   * Muestra el modal de éxito con mensaje personalizado.
   * @param estadoAnterior El estado anterior del usuario (1 para activo, 0 para inactivo) - solo para cambios de estado
   * @param tipo El tipo de operación: 'estado' o 'rol'
   */
  mostrarModalExito(estadoAnterior: number, tipo: 'estado' | 'rol'): void {
    if (this.usuarioSeleccionado) {
      let mensaje = '';
      const persona = this.getPersonaForUser(
        this.usuarioSeleccionado.persona.ci
      );
      const nombreCompleto = persona
        ? `${persona.nombre} ${persona.apellidop}`
        : this.usuarioSeleccionado.username;

      if (tipo === 'estado') {
        const accion = estadoAnterior === 1 ? 'deshabilitado' : 'habilitado';
        mensaje = `El usuario <strong>${nombreCompleto}</strong> ha sido ${accion} correctamente.`;
      } else if (tipo === 'rol') {
        mensaje = `El rol del usuario <strong>${nombreCompleto}</strong> ha sido cambiado a <strong>${this.nuevoRolSeleccionado}</strong> correctamente.`;
      }

      // Actualizar el mensaje en el modal
      const mensajeElement = document.getElementById('mensajeExitoEstado');
      if (mensajeElement) {
        mensajeElement.innerHTML = mensaje;
      }
    }

    // Mostrar el modal de éxito
    this.modalExitoEstado?.show();
  }

  /**
   * Actualiza la lista de usuarios después de un cambio.
   */
  actualizarListaUsuarios(): void {
    // Forzar la actualización de la vista
    this.applyFiltersAndSort();
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
   * Muestra un modal de mensaje general.
   */
  showModalMessage(
    title: string,
    message: string,
    isSuccess: boolean,
    details: string[] = []
  ): void {
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
}
