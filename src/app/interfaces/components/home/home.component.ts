// home.component.ts
import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { MenuComponent } from '../menu/menu.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router'; // Importar Router y NavigationEnd
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators'; // Para filtrar eventos del router

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    MenuComponent,
    FooterComponent,
    RouterOutlet,
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  sidebarActive: boolean = false;
  mostrarBotonMenu: boolean = false;

  // No necesitamos el array sidebarActiveRoutes ni otras lógicas de condición.

  constructor(private router: Router) { } // Inyecta el Router

  ngOnInit() {
    // Suscribirse a los eventos del router para detectar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd) // Filtra solo los eventos de finalización de navegación
    ).subscribe((event: NavigationEnd) => {
      // **Lógica para decidir si mostrar el botón del menú y permitir el sidebar**
      // El botón de menú debe mostrarse SIEMPRE, excepto cuando la ruta sea exactamente '/home/inicio'.
      this.mostrarBotonMenu = (event.urlAfterRedirects !== '/home/inicio');
      
      // Si el botón del menú se oculta (porque estamos en /home/inicio),
      // asegúrate de que el sidebar también se cierre.
      if (!this.mostrarBotonMenu) {
        this.sidebarActive = false; 
      }
    });

    // Llamar a la función de actualización al inicio también, por si la página carga
    // directamente en 'home/inicio' o en otra ruta al inicio.
    this.mostrarBotonMenu = (this.router.url !== '/home/inicio');
  }

  /**
   * Alterna el estado de visibilidad del sidebar.
   * Este método es llamado por el HeaderComponent cuando se hace clic en el botón.
   */
  toggleSidebar() {
    // Solo permitimos alternar si el botón está visible (y por lo tanto, habilitado)
    if (this.mostrarBotonMenu) { 
      this.sidebarActive = !this.sidebarActive;
      console.log('Sidebar activo:', this.sidebarActive);
    }
  }
}