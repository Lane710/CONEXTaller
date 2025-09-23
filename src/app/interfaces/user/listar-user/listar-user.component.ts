import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- Importa FormsModule para [(ngModel)]
import { forkJoin } from 'rxjs';

import { usuarios } from '../../../models/PersonModel/usuarios';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { personas } from '../../../models/PersonModel/personas';
import { PersonasService } from '../../../services/PersonServis/personas.service';


declare var bootstrap: any;

@Component({
  selector: 'app-listar-usuarios',
  standalone: true,
  imports: [CommonModule, NgIf, NgClass, RouterLink, FormsModule], // <-- Agrega FormsModule aquí
  templateUrl: './listar-user.component.html',
  styleUrl: './listar-user.component.css',
})
export class ListarUserComponent implements OnInit, AfterViewInit {
  // Listas de datos
  allUsers: usuarios[] = [];
  filteredUsers: usuarios[] = [];
  personas: personas[] = [];

  // Propiedades de estado de la UI
  isLoading: boolean = false;
  errorMessage: string | null = null;
  usuarioSeleccionado: usuarios | null = null;

  // Propiedades para los filtros
  searchTerm: string = '';
  filterStatus: 'todos' | 'activo' | 'inactivo' = 'todos';
  filterRole: string = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente';

  // Modal de confirmación (deshabilitar/habilitar)
  @ViewChild('confirmarAccionUsuarioModal') confirmarAccionUsuarioModalRef!: ElementRef;
  private confirmarAccionUsuarioModal: any;

  // Modal de detalles
  @ViewChild('modalDetallesUsuarioRef') modalDetallesUsuarioRef!: ElementRef;
  private modalDetallesUsuario: any;

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
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    if (this.confirmarAccionUsuarioModalRef) {
      this.confirmarAccionUsuarioModal = new bootstrap.Modal(
        this.confirmarAccionUsuarioModalRef.nativeElement
      );
    }
    if (this.modalDetallesUsuarioRef) {
      this.modalDetallesUsuario = new bootstrap.Modal(
        this.modalDetallesUsuarioRef.nativeElement
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
  applyFiltersAndSort(): void {
    let tempUsers = [...this.allUsers];

    // 1. Filtrado por término de búsqueda (nombre o usuario)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      tempUsers = tempUsers.filter((user) => {
        const persona = this.getPersonaForUser(user.persona.ci);
        const fullName = `${persona?.nombre || ''} ${
          persona?.apellidop || ''
        } ${persona?.apellidom || ''}`.toLowerCase();
        return user.username.toLowerCase().includes(term) || fullName.includes(term);
      });
    }

    // 2. Filtrado por estado
    if (this.filterStatus !== 'todos') {
      const estado = this.filterStatus === 'activo' ? 1 : 0;
      tempUsers = tempUsers.filter((user) => user.estado === estado);
    }

    // 3. Filtrado por rol
    if (this.filterRole !== 'todos') {
      tempUsers = tempUsers.filter((user) => user.rol.nombreRol === this.filterRole);
    }

    // 4. Ordenamiento por fecha de creación (asc o desc)
    tempUsers.sort((a, b) => {
      // Nota: asumiendo que `fechaCreacion` existe en la interfaz `usuarios`
      const dateA = new Date(a.fechaCreacion || 0).getTime();
      const dateB = new Date(b.fechaCreacion || 0).getTime();
      return this.sortDirection === 'reciente' ? dateB - dateA : dateA - dateB;
    });

    this.filteredUsers = tempUsers;
    this.currentPage = 1; // Reiniciar paginación al cambiar los filtros
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
      this.showModalMessage('Error de Navegación', 'No se proporcionó un nombre de usuario para gestionar roles.', false);
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
      this.showModalMessage('Error de Navegación', 'No se proporcionó un nombre de usuario para modificar.', false);
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
        next: (response) => {
          if (response.success) {
            this.confirmarAccionUsuarioModal?.hide();
            this.loadAllData();
            this.showModalMessage('Éxito', response.message || 'Estado del usuario cambiado con éxito.', true);
          } else {
            this.showModalMessage('Error', response.message || 'Error al cambiar el estado del usuario.', false);
          }
        },
        error: (err) => {
          this.showModalMessage('Error de Conexión', 'Error de comunicación al cambiar el estado del usuario.', false, [err.message || 'Error desconocido']);
        },
      });
    } else {
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
   * Muestra un modal de mensaje general.
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

  
}