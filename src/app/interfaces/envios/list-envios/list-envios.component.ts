import { Component, OnInit } from '@angular/core';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';

@Component({
  selector: 'app-list-envios',
  standalone: true,
  imports: [NgClass, FormsModule, NgFor, NgIf, DatePipe],
  templateUrl: './list-envios.component.html',
  styleUrls: ['./list-envios.component.css'],
})
export class ListEnviosComponent implements OnInit {
  // Declaración de variables para almacenar datos y controlar la paginación
  envios: envios[] = [];
  allEnvios: envios[] = []; // Nueva variable para guardar todos los envíos
  paginatedEnvios: envios[] = [];
  busquedaTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 0;
  pages: number[] = [];
  private readonly pagesToShow = 5; // Se mostrarán 5 botones de página a la vez
  envioSeleccionado: any; // Variable para almacenar el envío seleccionado del listado
  estadoSeleccionado: string = 'preparando pedido'; // Variable para el estado del modal

  posiblesEstados: string[] = [
    'Preparando pedido',
    'En camino',
    'Entregado',
    'No entregado',
    'Cancelado',
    'Devuelto',
  ];
  // Nueva variable para almacenar el envío seleccionado para el modal
  selectedEnvio: envios | null = null;

  constructor(private enviosS: EnviosService) {}

  ngOnInit(): void {
    this.listadoEnvios();
  }

  listadoEnvios() {
    this.enviosS.listado().subscribe((data: any) => {
      this.allEnvios = data.data; // Guardamos la lista completa
      this.envios = this.allEnvios; // Usamos la lista completa para la paginación inicial
      this.applyFilter(); // Llamamos al filtro para inicializar la paginación correctamente
    });
  } // Lógica de paginación

  updatePagination(): void {
    this.totalPages = Math.ceil(this.envios.length / this.itemsPerPage);
    // Vuelve a la primera página si la actual no es válida después del filtrado
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.generatePaginationPages();
    this.paginateEnvios();
  }

  generatePaginationPages(): void {
    const pages = [];
    let startPage;
    let endPage;

    if (this.totalPages <= this.pagesToShow) {
      // Si el total de páginas es menor o igual al número de páginas a mostrar, muestra todas.
      startPage = 1;
      endPage = this.totalPages;
    } else {
      // Si hay más páginas que el límite, calcula el rango dinámico.
      const middle = Math.floor(this.pagesToShow / 2);
      if (this.currentPage <= middle) {
        // Al principio, muestra de 1 hasta el límite.
        startPage = 1;
        endPage = this.pagesToShow;
      } else if (this.currentPage + middle >= this.totalPages) {
        // Al final, muestra las últimas páginas.
        startPage = this.totalPages - this.pagesToShow + 1;
        endPage = this.totalPages;
      } else {
        // En el medio, el rango se centra en la página actual.
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
  } // Lógica de filtrado

  applyFilter() {
    const filteredEnvios = this.allEnvios.filter((envio) => {
      // Filtramos sobre la lista completa
      const nombreReceptor =
        `${envio.nombreReceptor} ${envio.apellidosReceptor}`.toLowerCase();
      const idEnvio = `env${envio.idEnvio}`.toLowerCase();
      const searchTerm = this.busquedaTerm.toLowerCase();

      return (
        nombreReceptor.includes(searchTerm) || idEnvio.includes(searchTerm)
      );
    });

    this.envios = filteredEnvios; // La lista para paginar ahora es la filtrada
    this.currentPage = 1;
    this.updatePagination(); // Llama a la nueva función de paginación
  } // Métodos de acción (ejemplo, puedes ajustarlos)

  // Método para seleccionar un envío y guardarlo en la variable
  selectEnvio(envio: any) {
    this.selectedEnvio = envio;
    // AQUI ES DONDE SE INICIALIZA EL VALOR CORRECTAMENTE
    this.estadoSeleccionado = envio.estado;
  }

  // Nuevo método para cancelar el envío
  guardarCambios() {
    if (this.selectedEnvio && this.estadoSeleccionado && this.estadoSeleccionado !== '') {
      // Si la condición se cumple, se hace el cambio
      this.enviosS.cambiarStado(this.selectedEnvio.idEnvio || 0, this.estadoSeleccionado).subscribe({
        next: (response) => {
          console.log('Estado modificado con éxito:', response);
          this.listadoEnvios();
          this.estadoSeleccionado = ''; // Se limpia el select
        },
        error: (error) => {
          console.error('Error al modificar el estado:', error);
        },
      });
    } else {
      // Opcional: mostrar un mensaje al usuario de que debe seleccionar un estado
      console.warn('No se ha seleccionado un estado válido.');
    }
  }

  modificarRedireccion(envio: any) {
    console.log('Redirigir para modificar el envío:', envio); // Lógica para navegar a la página de modificación
  }

  // Este método se activa cuando haces clic en el botón
  selectEnvioModal(envio: any) {
    this.envioSeleccionado = envio;
    this.estadoSeleccionado = envio.estado; // Establece el estado actual como valor inicial del select
    console.log('Envío seleccionado:', this.envioSeleccionado);
  }

  guardarEstado() {
    if (this.envioSeleccionado) {
      this.envioSeleccionado.estado = this.estadoSeleccionado;
      console.log(
        `Estado del pedido ${this.envioSeleccionado.idPedido} actualizado a: ${this.estadoSeleccionado}`
      );
    }
  }
}
