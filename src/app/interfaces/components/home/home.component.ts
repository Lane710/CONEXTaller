// En src/app/home.component.ts
import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { MenuComponent } from '../menu/menu.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterOutlet, Router, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SpinnerComponent } from '../spinner/spinner.component';
import { LoadingService } from '../../../services/LoadingService.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    MenuComponent,
    FooterComponent,
    RouterOutlet,
    CommonModule,
    SpinnerComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  sidebarActive: boolean = false;
  mostrarBotonMenu: boolean = false;

  constructor(private router: Router, private loadingService: LoadingService) { }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.loadingService.show();
      });

    this.router.events
      .pipe(filter(event => 
          event instanceof NavigationEnd || 
          event instanceof NavigationCancel || 
          event instanceof NavigationError
      ))
      .subscribe(() => {
        // Usa un temporizador para simular un tiempo mínimo de carga
        // Esto previene que el cargador parpadee en navegaciones rápidas.
        setTimeout(() => {
            this.loadingService.hide();
        }, 500);
      });

    // Lógica para mostrar/ocultar el botón del menú
    this.mostrarBotonMenu = (this.router.url !== '/home/inicio');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.mostrarBotonMenu = (event.urlAfterRedirects !== '/home/inicio');
      if (!this.mostrarBotonMenu) {
        this.sidebarActive = false; 
      }
    });
  }

  toggleSidebar() {
    if (this.mostrarBotonMenu) { 
      this.sidebarActive = !this.sidebarActive;
    }
  }
}