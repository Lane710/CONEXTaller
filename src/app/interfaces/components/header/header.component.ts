import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // NavigationEnd ya no es necesario aquí

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  // Volvemos a hacer de mostrarBotonMenu un Input
  // Este componente solo recibe la señal del padre sobre si el botón debe mostrarse.
  
  @Input() mostrarBotonMenu: boolean = false;
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  user: string = ''; // Variable para almacenar el usuario actual
   isLoggedIn = false; // El estado inicial es falso
  constructor(private router: Router) {}


  ngOnInit(): void {
    
    this.checkLoginStatus();
  }

  emitToggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  logout() {
    localStorage.removeItem('jwt_token');
    this.router.navigate(['/login']);
  }
  insertarModificar() {
    
    localStorage.setItem('ModUser', this.user);
  }

  checkLoginStatus() {
    // Si el token existe y no es una cadena vacía, consideramos que el usuario ha iniciado sesión
    const token = localStorage.getItem('jwt_token');
    const usernameFromLocalStorage = localStorage.getItem('current_username');
    if (token && usernameFromLocalStorage!== '') {
      this.isLoggedIn = true;
      this.user = usernameFromLocalStorage ? usernameFromLocalStorage : '';
    } else {
      this.isLoggedIn = false;
    }
  }
}
