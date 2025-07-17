import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// ¡¡¡CORRECCIÓN DE RUTAS!!!
import { roles } from '../../../models/PersonModel/roles'; // Asegúrate de que esta ruta sea correcta
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { ApiResponse } from '../../../models/api-response';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit, OnDestroy {
  @Input() sidebarActive: boolean = false;

  userRole: roles | null = null;

  readonly ROLES = {
    ADMINISTRADOR: 'administrador',
    PROVEEDOR: 'proveedor',
    DUENA: 'dueno', // Asumiendo 'duena' como rol
    TRABAJADOR: 'trabajador',
    CLIENTE: 'Cliente'
  };

  constructor(private usuariosService: UsuariosService) { }

  ngOnInit(): void {
    const idUsuarioString = localStorage.getItem('usuario_actual');

    
 
    if (idUsuarioString !== null) {
      this.usuariosService.getRoleByUsername(idUsuarioString).subscribe({
        next: (apiResponse: ApiResponse) => {
          
          if (apiResponse && apiResponse.success && apiResponse.data) {
            // CORRECCIÓN AQUÍ: Acceder al primer elemento del array
            this.userRole = (apiResponse.data as roles[])[0];
            
          } else {
            
            this.userRole = null;
          }
        },
        error: (err: any) => {
          
          this.userRole = null;
        }
      });
    } else {
      
      this.userRole = null;
    }
  }

  ngOnDestroy(): void { } // Ya no es necesario si no hay suscripciones activas

  hasRole(roleName: string): boolean {
    return this.userRole?.nombreRol === roleName;
  }

  isAdministrador(): boolean {
    return this.hasRole(this.ROLES.ADMINISTRADOR);
  }

  isDuena(): boolean {
    return this.hasRole(this.ROLES.DUENA);
  }

  isTrabajador(): boolean {
    return this.hasRole(this.ROLES.TRABAJADOR);
  }

  isProveedor(): boolean {
    return this.hasRole(this.ROLES.PROVEEDOR);
  }

  isCliente(): boolean {
    return this.hasRole(this.ROLES.CLIENTE);
  }
}
