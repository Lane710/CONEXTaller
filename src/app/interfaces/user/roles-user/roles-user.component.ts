import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { ApiResponse } from '../../../models/api-response';
import { roles } from '../../../models/PersonModel/roles';
import { HttpErrorResponse } from '@angular/common/http';
import { usuarios } from '../../../models/PersonModel/usuarios';
import { Router } from '@angular/router'; // Importar Router

declare var bootstrap: any;

@Component({
  selector: 'app-roles-user',
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterLink], // Aseguramos RouterLink para el botón de Volver
  templateUrl: './roles-user.component.html',
  styleUrl: './roles-user.component.css',
})
export class RolesUserComponent implements OnInit, AfterViewInit {
  rolesDisponibles: roles[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null; // Para mensajes de éxito
  username: string | null = null; // Cambiado de userId a username
  usuario: usuarios | null = null;

  selectedRoleIdToAssign: number | null = null;

  @ViewChild('rolModificadoExitoModal') rolModificadoExitoModalRef!: ElementRef;
  private rolModificadoExitoModal: any;

  @ViewChild('rolNoCambiadoModal') rolNoCambiadoModalRef!: ElementRef;
  private rolNoCambiadoModal: any;

  // Nuevo modal genérico para errores
  @ViewChild('errorModal') errorModalRef!: ElementRef;
  private errorModal: any;

  constructor(
    private usuariosService: UsuariosService,
    private route: ActivatedRoute,
    private router: Router // Inyectar Router
  ) {}

  ngOnInit(): void {
    // Intentar obtener el username de localStorage primero
    const usernameFromLocalStorage = localStorage.getItem('usuario_actual');

    if (usernameFromLocalStorage) {
      this.username = usernameFromLocalStorage;
      localStorage.removeItem('usuario_actual'); // Limpiar localStorage después de usarlo
      console.log('Username de usuario recibido de localStorage en RolesUserComponent:', this.username);
      this.loadUsuarioDetails(this.username);
      this.loadRolesDisponibles();
    } else {
      // Si no se encuentra en localStorage, recurrir a los parámetros de la URL
      this.route.paramMap.subscribe((params) => {
        const usernameParam = params.get('username');
        if (usernameParam) {
          this.username = usernameParam;
          console.log('Username de usuario recibido de la URL en RolesUserComponent:', this.username);
          this.loadUsuarioDetails(this.username);
          this.loadRolesDisponibles();
        } else {
          this.errorMessage = 'Nombre de usuario no proporcionado en la URL ni en el almacenamiento local.';
          console.error(this.errorMessage);
          this.showErrorModal(); // Mostrar modal de error
        }
      });
    }
  }

  ngAfterViewInit(): void {
    // Inicializar el modal de éxito
    if (this.rolModificadoExitoModalRef) {
      this.rolModificadoExitoModal = new bootstrap.Modal(this.rolModificadoExitoModalRef.nativeElement);
    }
    // Inicializar el modal de rol no cambiado
    if (this.rolNoCambiadoModalRef) {
      this.rolNoCambiadoModal = new bootstrap.Modal(this.rolNoCambiadoModalRef.nativeElement);
    }
    // Inicializar el modal de error genérico
    if (this.errorModalRef) {
      this.errorModal = new bootstrap.Modal(this.errorModalRef.nativeElement);
    }
  }

  get currentRoleName(): string {
    if (this.usuario && this.usuario.rol?.idRol !== undefined && this.rolesDisponibles.length > 0) {
      const currentRole = this.rolesDisponibles.find(
        (rol) => rol.idRol === this.usuario!.rol.idRol
      );
      return currentRole ? currentRole.nombreRol || 'Rol desconocido' : 'No asignado';
    }
    return 'Cargando...';
  }

  loadRolesDisponibles(): void {
    this.usuariosService.roles().subscribe({
      next: (response: ApiResponse) => {
        if (response.success && response.data) {
          this.rolesDisponibles = response.data as roles[];
          console.log('Roles disponibles obtenidos:', this.rolesDisponibles);
        } else {
          console.error('Error al obtener roles disponibles:', response.message);
          this.errorMessage = response.message || 'No se pudieron cargar los roles disponibles.';
          this.showErrorModal(); // Mostrar modal de error
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al obtener roles disponibles (HTTP):', err);
        this.errorMessage =
          'Error al cargar los roles disponibles: ' +
          (err.error?.message || err.message || 'Error desconocido');
        this.showErrorModal(); // Mostrar modal de error
      },
    });
  }

  // Cambiado para recibir username en lugar de userId
  loadUsuarioDetails(username: string): void {
    this.usuariosService.findById(username).subscribe({
      next: (response: ApiResponse) => {
        if (response.success && response.data) {
          this.usuario = response.data as usuarios;
          // Asignar el idRol actual del usuario al select de roles
          this.selectedRoleIdToAssign = this.usuario.rol?.idRol !== undefined ? this.usuario.rol.idRol : null;
          console.log('Detalles del usuario obtenidos:', this.usuario);
        } else {
          console.error('Error al obtener detalles del usuario:', response.message);
          this.errorMessage = response.message || 'No se pudieron cargar los detalles del usuario.';
          this.showErrorModal(); // Mostrar modal de error
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al obtener detalles del usuario (HTTP):', err);
        this.errorMessage =
          'Error al cargar los detalles del usuario: ' +
          (err.error?.message || err.message || 'Error desconocido');
        this.showErrorModal(); // Mostrar modal de error
      },
    });
  }

  modifyRole(): void {
    if (this.username === null) {
      this.errorMessage = 'Error: No se ha cargado el nombre de usuario.';
      this.showErrorModal();
      return;
    }
    if (this.selectedRoleIdToAssign === null) {
      this.errorMessage = 'Por favor, selecciona un rol para modificar.';
      this.showErrorModal();
      return;
    }

    // Validación: Si el rol seleccionado es el mismo que el actual
    if (this.usuario && this.usuario.rol?.idRol === this.selectedRoleIdToAssign) {
      console.log('El rol seleccionado es el mismo que el actual. No se realizará la modificación.');
      this.rolNoCambiadoModal?.show(); // Muestra el modal de "rol no cambiado"
      return; // Detener la ejecución
    }
console.log('Modificando rol del usuario:', this.username, 'a nuevo rol ID:', this.selectedRoleIdToAssign);
    this.usuariosService.updateUserRole(this.username, this.selectedRoleIdToAssign).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.successMessage = '¡Rol modificado exitosamente!';
          this.rolModificadoExitoModal?.show();
          this.loadUsuarioDetails(this.username!); // Recargar detalles del usuario para reflejar el cambio
        } else {
          this.errorMessage = 'Error al modificar rol: ' + (response.message || 'Error desconocido');
          console.error('Error en la API al modificar rol:', response.message);
          this.showErrorModal(); // Mostrar modal de error
        }
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Error de conexión al modificar rol: ' + (err.error?.message || err.message || 'Error desconocido');
        console.error('Error HTTP al modificar rol:', err);
        this.showErrorModal(); // Mostrar modal de error
      },
    });
  }

  // Método para mostrar el modal de error
  showErrorModal(): void {
    if (this.errorModal) {
      this.errorModal.show();
    }
  }

  // Método para cerrar el modal de error
  closeErrorModal(): void {
    if (this.errorModal) {
      this.errorModal.hide();
    }
    this.errorMessage = null; // Limpiar el mensaje de error al cerrar
  }

  // Método para cerrar el modal de éxito (si es necesario)
  closeSuccessModal(): void {
    if (this.rolModificadoExitoModal) {
        this.rolModificadoExitoModal.hide();
    }
    this.successMessage = null;
  }
}