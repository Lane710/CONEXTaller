import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/aut.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  @Input() mostrarBotonMenu: boolean = false;
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  user: string = '';

  // Inyectamos el AuthService en el constructor para usarlo en la plantilla
  constructor(private router: Router, public authService: AuthService) {}

  ngOnInit(): void {
    // Al iniciar el componente, obtenemos el nombre de usuario.
    const usernameFromLocalStorage = localStorage.getItem('current_username');
    this.user = usernameFromLocalStorage ? usernameFromLocalStorage : '';
  }

  emitToggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  // Ahora el logout está centralizado en el AuthService
  logout() {
    this.authService.logout();
  }

  insertarModificar() {
    localStorage.setItem('ModUser', this.user);
  }
}