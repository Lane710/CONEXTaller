// src/app/menu/menu.component.ts

import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, UserState } from '../../../services/aut.service';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';


@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive], // Agregamos RouterLinkActive
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {
  
  @Input() sidebarActive: boolean = false;
  
  // Añadimos un EventEmitter para avisarle al padre (Layout) que debe cerrar el menú
  @Output() closeSidebarEvent = new EventEmitter<void>();

  userRole: string | null = null;
  username: string | null = null;
  
  // Variables para la foto y nombre real del usuario
  fotoPerfil: string = 'https://placehold.co/100x100?text=User'; // Foto por defecto
  nombreCompleto: string = 'Cargando...';

  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private usuariosService: UsuariosService // Inyectamos el servicio
  ) { }

  ngOnInit(): void {
    // 1. Suscribirse al estado del AuthService
    this.authService.userState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((userState: UserState) => {
        this.userRole = userState.role;
        this.username = userState.username;

        // 2. Si tenemos un username, buscamos sus datos completos en la BD
        if (this.username) {
          this.cargarDatosUsuario(this.username);
        } else {
          this.nombreCompleto = 'Usuario no logueado';
        }
      });
  }

  // Método para buscar los datos del usuario en la BD
  private cargarDatosUsuario(username: string): void {
    this.usuariosService.findById(username).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const usuarioDb = response.data;
          
          // Armamos el nombre completo (ajusta esto según las propiedades exactas de tu modelo 'usuarios')
          this.nombreCompleto = `${usuarioDb.nombre || ''} ${usuarioDb.apellido || ''}`.trim();
          
          // Si el usuario tiene una URL de imagen guardada en la BD, la usamos.
          if (usuarioDb.persona.fotoUrl) {
            this.fotoPerfil = usuarioDb.persona.fotoUrl;
          }
        }
      },
      error: (err) => {
        console.error('Error al obtener datos del usuario para el menú:', err);
        this.nombreCompleto = this.username || 'Usuario'; // Fallback
      }
    });
  }

  // Método que se llama al hacer clic en cualquier enlace del menú
  cerrarMenuAlNavegar(): void {
    // Si estamos en un dispositivo móvil (o si simplemente quieres que siempre se cierre al hacer clic)
    if (this.sidebarActive) {
      this.closeSidebarEvent.emit(); // Le avisa al padre que apague el sidebarActive
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}