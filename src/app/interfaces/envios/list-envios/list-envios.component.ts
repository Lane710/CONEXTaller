import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

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


isLoading: boolean = false;
errorMessage: string | null = null;
filterStatus: string = 'todos';
sortDirection: string = 'reciente';


  selectedEnvio: envios | null = null; 
  estadoSeleccionado: string = ''; 

  // NUEVO: Para controlar la apertura automática del modal para PEDIDOS
  idPedidoFromUrl: number | null = null;
  envioFromPedido: envios | null = null;

  // NUEVO: Para controlar la apertura automática del modal para VENTAS
  idVentaFromUrl: number | null = null;
  envioFromVenta: envios | null = null;

  posiblesEstados: string[] = [
    'PENDIENTE', 
    'ENTREGADO',
    'DEVUELTO',
  ];

  // NUEVO: Referencia al modal para abrirlo programáticamente
  @ViewChild('modalDetallesEnvio') modalDetallesEnvio!: ElementRef;

  constructor(
    private enviosS: EnviosService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener parámetros de la URL
    this.getParametersFromUrl();
    
    // Cargar todos los envíos
    this.listadoEnvios();
  }

  // NUEVO MÉTODO MODIFICADO: Obtener parámetros de la URL (pedido o venta)
  getParametersFromUrl(): void {
    this.route.params.subscribe(params => {
      // Para pedidos
      this.idPedidoFromUrl = params['idPedido'] ? +params['idPedido'] : null;
      
      // Para ventas
      this.idVentaFromUrl = params['idVenta'] ? +params['idVenta'] : null;
      
      console.log('ID Pedido desde URL:', this.idPedidoFromUrl);
      console.log('ID Venta desde URL:', this.idVentaFromUrl);
      
      // Buscar envío según el parámetro recibido
      if (this.idPedidoFromUrl) {
        this.buscarEnvioPorPedido();
      } else if (this.idVentaFromUrl) {
        this.buscarEnvioPorVenta();
      }
    });
  }

  // MÉTODO EXISTENTE: Buscar envío por ID de pedido
  buscarEnvioPorPedido(): void {
    if (this.idPedidoFromUrl) {
      this.enviosS.findByPedidoId(this.idPedidoFromUrl).subscribe({
        next: (response: any) => {
          if (response.data) {
            this.envioFromPedido = response.data;
            console.log('Envío encontrado para el pedido:', this.envioFromPedido);
            
            // Abrir el modal automáticamente
            setTimeout(() => {
              this.abrirModalAutomaticamente();
            }, 500);
          } else {
            console.log('No se encontró envío para este pedido');
          }
        },
        error: (error) => {
          console.error('Error al buscar envío por pedido:', error);
        }
      });
    }
  }

  // NUEVO MÉTODO: Buscar envío por ID de venta
  buscarEnvioPorVenta(): void {
    if (this.idVentaFromUrl) {
      this.enviosS.findByVentaId(this.idVentaFromUrl).subscribe({
        next: (response: any) => {
          if (response.data) {
            this.envioFromVenta = response.data;
            console.log('Envío encontrado para la venta:', this.envioFromVenta);
            
            // Abrir el modal automáticamente
            setTimeout(() => {
              this.abrirModalAutomaticamente();
            }, 500);
          } else {
            console.log('No se encontró envío para esta venta');
          }
        },
        error: (error) => {
          console.error('Error al buscar envío por venta:', error);
        }
      });
    }
  }

  // MÉTODO MODIFICADO: Abrir el modal automáticamente para pedido o venta
  abrirModalAutomaticamente(): void {
    const envioParaMostrar = this.envioFromPedido || this.envioFromVenta;
    
    if (envioParaMostrar) {
      this.selectedEnvio = envioParaMostrar;
      
      // Usar Bootstrap para abrir el modal programáticamente
      const modalElement = document.getElementById('modalDetallesEnvio');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  }

  // MÉTODO EXISTENTE (cargar todos los envíos)
  listadoEnvios() {
    this.enviosS.listado().subscribe((data: any) => {
      console.log('Todos los envíos:', data.data)
      this.allEnvios = data.data;
      this.applyFilter();
    });
  }

  // ... (el resto de tus métodos se mantienen igual)

  // Modifica el applyFilter para incluir los nuevos filtros
applyFilter() {
  let tempEnvios = [...this.allEnvios];

  // Filtrado por texto
  if (this.busquedaTerm) {
    const term = this.busquedaTerm.toLowerCase();
    tempEnvios = tempEnvios.filter((envio) => {
      const nombreReceptor = `${envio.nombreReceptor} ${envio.apellidosReceptor}`.toLowerCase();
      const codigoSeguimiento = (envio.codigoSeguimiento || '').toLowerCase();
      return nombreReceptor.includes(term) || codigoSeguimiento.includes(term);
    });
  }

  // Filtrado por estado
  if (this.filterStatus !== 'todos') {
    const statusMap: { [key: string]: string } = {
      'pendiente': 'PENDIENTE',
      'entregado': 'ENTREGADO',
      'devuelto': 'DEVUELTO',
      'cancelado': 'CANCELADO'
    };
    const mappedStatus = statusMap[this.filterStatus];
    tempEnvios = tempEnvios.filter((envio) => envio.estado === mappedStatus);
  }

  // Ordenamiento por fecha
  tempEnvios.sort((a, b) => {
    const dateA = new Date(a.fechaCreacion || '').getTime();
    const dateB = new Date(b.fechaCreacion || '').getTime();
    if (this.sortDirection === 'reciente') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  this.envios = tempEnvios;
  this.updatePagination();
}

  updatePagination(): void {
    this.totalPages = Math.ceil(this.envios.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.generatePaginationPages();
    this.paginateEnvios();
  }

  generatePaginationPages(): void {
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

  selectEnvio(envio: envios) {
    this.selectedEnvio = envio;
    this.estadoSeleccionado = envio.estado || '';
  }

  guardarCambios() {
    if (this.selectedEnvio && this.estadoSeleccionado && this.estadoSeleccionado !== '') {
      this.enviosS
        .cambiarStado(this.selectedEnvio.idEnvio || 0, this.estadoSeleccionado)
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
    if (this.selectedEnvio) {
      this.enviosS.cambiarStado(this.selectedEnvio.idEnvio || 0, 'CANCELADO')
        .subscribe({
          next: (response) => {
            console.log('Envío cancelado con éxito:', response);
            this.listadoEnvios();
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
    if (this.selectedEnvio) {
      this.enviosS.cambiarStado(this.selectedEnvio.idEnvio || 0, 'PENDIENTE')
        .subscribe({
          next: (response) => {
            console.log('Envío reactivado con éxito:', response);
            this.listadoEnvios();
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
    console.log('Redirigiendo para modificar el envío:', envio.idEnvio);
    this.router.navigate(['home/modificarEnvio/', envio.idEnvio]);
  }

  formatEstado(estado?: string): string {
    if (!estado) return 'Indefinido';
    return estado
      .replace(/_/g, ' ') 
      .toLowerCase() 
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1)
      ); 
  }

  // NUEVO MÉTODO: Obtener el tipo de origen (pedido o venta) para mostrar en el modal
  getOrigenEnvio(): string {
    if (this.envioFromPedido) {
      return 'Pedido';
    } else if (this.envioFromVenta) {
      return 'Venta';
    } else if (this.selectedEnvio) {
      // Si no viene de URL, intentar determinar por los datos del envío
      return this.selectedEnvio.pedido ? 'Pedido' : 'Venta';
    }
    return 'Desconocido';
  }

  // NUEVO MÉTODO: Obtener ID del origen
  getIdOrigen(): string {
    if (this.idPedidoFromUrl) {
      return `PED-${this.idPedidoFromUrl}`;
    } else if (this.idVentaFromUrl) {
      return `VNT-${this.idVentaFromUrl}`;
    } else if (this.selectedEnvio) {
      if (this.selectedEnvio.pedido) {
        return `PED-${this.selectedEnvio.pedido.idPedido}`;
      }
    }
    return 'N/A';
  }

  
// Agrega estos métodos a tu clase
onStatusChange(status: string): void {
  this.filterStatus = status;
  this.currentPage = 1;
  this.applyFilter();
}

onSortChange(direction: string): void {
  this.sortDirection = direction;
  this.currentPage = 1;
  this.applyFilter();
}


}