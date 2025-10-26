import { Component, OnInit } from '@angular/core';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-envios',
  standalone: true,
  imports: [NgClass, FormsModule, NgFor, NgIf, DatePipe],
  templateUrl: './list-envios.component.html',
  styleUrls: ['./list-envios.component.css'],
})
export class ListEnviosComponent implements OnInit {
  allEnvios: envios[] = [];
  envios: envios[] = [];
  paginatedEnvios: envios[] = [];
  busquedaTerm: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 0;
  pages: number[] = [];
  private readonly pagesToShow = 5;

  selectedEnvio: envios | null = null; 
  estadoSeleccionado: string = ''; 

  posiblesEstados: string[] = [
    'PENDIENTE', 
    'ENTREGADO',
    'DEVUELTO',
  ];

  constructor(private enviosS: EnviosService, private router: Router) {}

  ngOnInit(): void {
    this.listadoEnvios();
  }

  listadoEnvios() {
    this.enviosS.listado().subscribe((data: any) => {
      console.log(data.data)
      this.allEnvios = data.data;
      this.applyFilter();
    });
  }

  // --- Lógica de Paginación ---
  updatePagination(): void {
    this.totalPages = Math.ceil(this.envios.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.generatePaginationPages();
    this.paginateEnvios();
  }

  generatePaginationPages(): void {
    // ... (sin cambios en esta función)
    const pages = [];
    let startPage, endPage;

    if (this.totalPages <= this.pagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      const middle = Math.floor(this.pagesToShow / 2);
      if (this.currentPage <= middle) {
        startPage = 1;
        endPage = this.pagesToShow;
      } else if (this.currentPage + middle >= this.totalPages) {
        startPage = this.totalPages - this.pagesToShow + 1;
        endPage = this.totalPages;
      } else {
        startPage = this.currentPage - middle;
        endPage = this.currentPage + middle;
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    this.pages = pages;
  }

  paginateEnvios() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEnvios = this.envios.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateEnvios();
      this.generatePaginationPages();
    }
  }

  // --- Lógica de Filtrado (MODIFICADA) ---
  applyFilter() {
    const searchTerm = this.busquedaTerm.toLowerCase();
    this.envios = this.allEnvios.filter((envio) => {
      const nombreReceptor =
        `${envio.nombreReceptor} ${envio.apellidosReceptor}`.toLowerCase();
      
      // --- CAMBIO AQUÍ ---
      // Buscamos por el código de seguimiento en lugar del ID
      const codigoSeguimiento = (envio.codigoSeguimiento || '').toLowerCase();
      
      // --- CAMBIO AQUÍ ---
      // Comparamos con el nombre O con el código de seguimiento
      return nombreReceptor.includes(searchTerm) || codigoSeguimiento.includes(searchTerm);
    });
    this.updatePagination();
  }

  // --- Métodos de Acción para los Modales ---

  selectEnvio(envio: envios) {
    // ... (sin cambios en esta función)
    this.selectedEnvio = envio;
    this.estadoSeleccionado = envio.estado || '';
  }

  guardarCambios() {
    // ... (sin cambios en esta función)
    if (
      this.selectedEnvio &&
      this.estadoSeleccionado &&
      this.estadoSeleccionado !== ''
    ) {
      this.enviosS
        .cambiarStado(
          this.selectedEnvio.idEnvio || 0,
          this.estadoSeleccionado
        )
        .subscribe({
          next: (response) => {
            console.log('Estado modificado con éxito:', response);
            this.listadoEnvios();
            this.estadoSeleccionado = '';
          },
          error: (error) => {
            console.error('Error al modificar el estado:', error);
          },
        });
    } else {
      console.warn('No se ha seleccionado un estado válido.');
    }
  }

  confirmarCancelacion() {
    // ... (sin cambios en esta función)
    if (this.selectedEnvio) {
      this.enviosS.cambiarStado(this.selectedEnvio.idEnvio || 0, 'CANCELADO')
        .subscribe({
          next: (response) => {
            console.log('Envío cancelado (eliminación lógica) con éxito:', response);
            this.listadoEnvios(); // Recargar la lista
          },
          error: (error) => {
            console.error('Error al cancelar el envío:', error);
          }
        });
    } else {
      console.warn('No hay ningún envío seleccionado para cancelar.');
    }
  }

  confirmarReactivacion() {
    // ... (sin cambios en esta función)
    if (this.selectedEnvio) {
      this.enviosS.cambiarStado(this.selectedEnvio.idEnvio || 0, 'PENDIENTE') // <-- Cambia a PREPARANDO
        .subscribe({
          next: (response) => {
            console.log('Envío reactivado con éxito:', response);
            this.listadoEnvios(); // Recargar la lista
          },
          error: (error) => {
            console.error('Error al reactivar el envío:', error);
          }
        });
    } else {
      console.warn('No hay ningún envío seleccionado para reactivar.');
    }
  }


  modificarRedireccion(envio: envios) {
    // ... (sin cambios en esta función)
    console.log('Redirigiendo para modificar el envío:', envio.idEnvio);
    this.router.navigate(['home/modificarEnvio/', envio.idEnvio]);
  }

  formatEstado(estado?: string): string {
    // ... (sin cambios en esta función)
    if (!estado) return 'Indefinido';
    return estado
      .replace(/_/g, ' ') 
      .toLowerCase() 
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1)
      ); 
  }
}