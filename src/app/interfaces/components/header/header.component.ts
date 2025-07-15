import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // NavigationEnd ya no es necesario aquí

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  // Volvemos a hacer de mostrarBotonMenu un Input
  // Este componente solo recibe la señal del padre sobre si el botón debe mostrarse.
  @Input() mostrarBotonMenu: boolean = false; 
  @Output() toggleSidebarEvent = new EventEmitter<void>();
user: string = ''; // Variable para almacenar el usuario actual
  constructor(private router: Router) { }

  ngOnInit(): void {
    const usernameFromLocalStorage = localStorage.getItem('current_username'); // Intenta obtener de localStorage
    this.user = usernameFromLocalStorage ? usernameFromLocalStorage : ''; // Asigna el usuario actual
    // Ya no necesitamos la lógica de router.events.subscribe aquí.
    // La responsabilidad de decidir cuándo mostrar el botón se mueve al componente padre.
  }

  emitToggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  logout() {
    localStorage.removeItem('jwt_token');
    this.router.navigate(['/login']);
  }
  insertarModificar(){
    console.log(this.user)
localStorage.setItem('ModUser', this.user);
  }
}