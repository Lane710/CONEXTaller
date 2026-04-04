import {
  Component,
  OnInit,
  AfterViewInit, // 1. Importar AfterViewInit
  ViewChild, // 2. Importar ViewChild
  ElementRef,
  ChangeDetectorRef, // 3. Importar ElementRef
} from '@angular/core';
import { VentasService } from '../../../services/ventasTienda/ventas.service';
import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  NgClass,
  NgFor,
  NgIf,
  TitleCasePipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ventas } from '../../../models/Ventas/ventas';
import { DetalleVentasService } from '../../../services/ventasTienda/detalle-ventas.service';
import { detalleVentaDTO } from '../../../DTOs/VentasDTO/detalleVentaDTO';
import { ModalScanComponent } from '../sales/modal-scan.component';
import { AsignacionUnidadesService } from '../../../services/ProductosServis/asignacion-unidades.service';
import { FacturacionService } from '../../../services/Facturacion/facturacion.service';
import { PDFacturaService } from '../../../services/Facturacion/PDFacturacion.service';

// Import Bootstrap JS types for TypeScript recognition
declare var bootstrap: any;

@Component({
  selector: 'app-list-sales',
  standalone: true,
  imports: [
    RouterLink,
    NgFor,
    NgClass,
    NgIf,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    TitleCasePipe,
    ModalScanComponent,
    DecimalPipe
  ],
  templateUrl: './list-sales.component.html',
  styleUrl: './list-sales.component.css',
})
// 4. Implementar AfterViewInit
export class ListSalesComponent implements OnInit, AfterViewInit {
  // --- Referencias de Modales (NUEVO) ---
  @ViewChild('confirmarAccionModal') confirmarAccionModalRef!: ElementRef;
  @ViewChild('detallesVentaModal') detallesVentaModalRef!: ElementRef;
  @ViewChild('mensajeGeneralModal') mensajeGeneralModalRef!: ElementRef;

  private confirmarAccionModalInstance: any;
  private detallesVentaModalInstance: any;
  private mensajeGeneralModalInstance: any; // 2. NUEVA INSTANCIA
  isCheckingEnvio: boolean = false;
  ventaEnProceso: number | null = null;
  mostrarScanModal: boolean = false;
  detallesParaScan: any[] = [];
  // Propiedades para el listado de ventas y filtrado
  allVentas: ventas[] = [];
  filteredVentas: ventas[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = false;
  selecVetaEstado: ventas | null = null;
  // Propiedades para los filtros
  searchTerm: string = '';
  filterStatus: 'todos' | 'completada' | 'pendiente' | 'cancelada' = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente';

  esModoConsulta: boolean = false;
  

  // --- VARIABLES FACTURACIÓN ---
  procesandoFactura: boolean = false;
  facturaActual: any = null; 
  verificandoFactura: boolean = false;


mensajeModal = {
    titulo: 'Información',
    texto: '',
    tipo: 'info' // Puede ser 'success', 'warning' o 'info'
  };
  // Propiedades para la paginación
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 0;
  pages: number[] = [];

  accionModal: 'cancelar' | 'habilitar' = 'cancelar';


readonly metodoPago = {
    EFECTIVO: 3333,
    TRANSFERENCIA_QR: 2222,
  };
  // Se mostrarán 5 botones de página a la vez
  private readonly pagesToShow = 5;

  ListaDetalleVentaSelec: any[] = [];

  // Propiedad para el modal de acciones
  ventaSeleccionada: { venta: ventas; detalles: detalleVentaDTO[] } | null =
    null;

  constructor(
    private ventasS: VentasService,
    private detalleVentaS: DetalleVentasService,
    private asignacionS: AsignacionUnidadesService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private facturacionService: FacturacionService, // INYECTADO
    private pdfFacturaService: PDFacturaService
  ) {}

  ngOnInit(): void {
    this.listadoVetnas();
  }

  // 5. Inicializar las instancias de Bootstrap
 ngAfterViewInit(): void {
    if (this.confirmarAccionModalRef) {
      this.confirmarAccionModalInstance = new bootstrap.Modal(this.confirmarAccionModalRef.nativeElement);
    }
    if (this.detallesVentaModalRef) {
      this.detallesVentaModalInstance = new bootstrap.Modal(this.detallesVentaModalRef.nativeElement);
    }
    // 4. INICIALIZAR EL NUEVO MODAL
    if (this.mensajeGeneralModalRef) {
      this.mensajeGeneralModalInstance = new bootstrap.Modal(this.mensajeGeneralModalRef.nativeElement);
    }
  }

  // --- Lógica de Modales (NUEVO) ---

  /**
   * @description Abre el modal de confirmación.
   */
  openConfirmarAccionModal(): void {
    if (this.confirmarAccionModalInstance) {
      this.confirmarAccionModalInstance.show();
    }
  }

  /**
   * @description Cierra el modal de confirmación.
   */
  closeConfirmarAccionModal(): void {
    if (this.confirmarAccionModalInstance) {
      this.confirmarAccionModalInstance.hide();
    }
  }

  /**
   * @description Abre el modal de detalles.
   */
  openDetallesVentaModal(): void {
    if (this.detallesVentaModalInstance) {
      this.detallesVentaModalInstance.show();
    }
  }
mostrarMensaje(titulo: string, texto: string, tipo: 'success' | 'warning' | 'info' = 'info') {
    // 1. Asignamos los textos
    this.mensajeModal = { titulo, texto, tipo };
    
    // 2. Forzamos a Angular a actualizar el HTML
    this.cdRef.detectChanges(); 
    
    // 3. INICIALIZACIÓN SEGURA (Si no existe, lo creamos ahora mismo)
    if (!this.mensajeGeneralModalInstance) {
      if (this.mensajeGeneralModalRef && this.mensajeGeneralModalRef.nativeElement) {
        this.mensajeGeneralModalInstance = new bootstrap.Modal(this.mensajeGeneralModalRef.nativeElement);
      } else {
        // Fallback: Si @ViewChild falla, lo buscamos directamente en el DOM (Infalible)
        const modalElement = document.getElementById('modalMensajeGeneral');
        if (modalElement) {
          this.mensajeGeneralModalInstance = new bootstrap.Modal(modalElement);
        }
      }
    }

    // 4. Mostramos el modal
    if (this.mensajeGeneralModalInstance) {
      this.mensajeGeneralModalInstance.show();
    } else {
      console.error('Error crítico: No se encontró el HTML del modal en la vista.');
    }
  }
  cerrarMensajeModal() {
    if (this.mensajeGeneralModalInstance) {
      this.mensajeGeneralModalInstance.hide();
    }
  }
  /**
   * @description Cierra el modal de detalles. (No es estrictamente necesario, pero se añade por consistencia)
   */
  closeDetallesVentaModal(): void {
    if (this.detallesVentaModalInstance) {
      this.detallesVentaModalInstance.hide();
    }
  }

  // 6. MODIFICACIÓN: selectVentaModalDetalle - Llama a openDetallesVentaModal
selectVentaModalDetalle(sale: ventas): void {
    this.detalleVentaS.listarPorIdVenta(sale.idVenta || 0).subscribe({
      next: (response) => {
        const detalles = response.data || [];
        this.ventaSeleccionada = { venta: sale, detalles: detalles };
        this.ListaDetalleVentaSelec = detalles;
        this.facturaActual = null; // Reseteamos por si acaso
        
        // Verificamos si la venta está COMPLETADA para buscar su factura
        if (sale.estado === 'COMPLETADA') {
          this.verificandoFactura = true;
          this.facturacionService.obtenerFacturaVenta(sale.idVenta!).subscribe({
            next: (factura) => {
              this.facturaActual = factura; // Cambiará el botón a Imprimir
              this.verificandoFactura = false;
            },
            error: () => {
              this.facturaActual = null; // Dejará el botón en Generar
              this.verificandoFactura = false;
            }
          });
        }

        this.openDetallesVentaModal();
      },
      error: (error) => console.error('Error al cargar detalles:', error),
    });
  }

  // 7. MODIFICACIÓN: selectVenta - Llama a openConfirmarAccionModal
  selectVenta(sale: ventas): void {
    this.selecVetaEstado = sale;
    this.accionModal = sale.estado === 'CANCELADA' ? 'habilitar' : 'cancelar';

    // Abrir el modal usando el nuevo método
    this.openConfirmarAccionModal();
  }

  // 8. MODIFICACIÓN: selectVentaCancelarConfirmar - Llama a closeConfirmarAccionModal
  selectVentaCancelarConfirmar(): void {
    if (!this.selecVetaEstado) {
      console.error('No hay venta seleccionada');
      return;
    }

    this.ventasS
      .cancelarConfirmarVenta(this.selecVetaEstado.idVenta!)
      .subscribe({
        next: (response) => {
          console.log(
            this.accionModal === 'cancelar'
              ? 'Venta cancelada correctamente.'
              : 'Venta habilitada correctamente.',
          );

          // Cerrar el modal usando el nuevo método
          this.closeConfirmarAccionModal();

          // SIN delay, ya que el método hide() de Bootstrap maneja el backdrop
          this.listadoVetnas();

          this.selecVetaEstado = null;
        },
        error: (err) => {
          console.error('Error al cambiar estado de venta:', err);
          this.closeConfirmarAccionModal();
        },
      });
  }

  /**
   * @description Carga la lista completa de ventas desde el servicio y aplica los filtros.
   */
  listadoVetnas(): void {
    this.isLoading = true;
    this.ventasS.findAll().subscribe({
      next: (response) => {
        this.allVentas = response.data || [];

        // Verificamos cuáles ventas necesitan atención de seriales
        this.allVentas.forEach((venta) => {
          // Esta lógica depende de si tu objeto 'venta' ya trae los detalles
          // o si necesitas una llamada adicional.
          // Si no los trae, lo detectaremos al hacer click en "Ver".
        });

        this.isLoading = false;
        this.applyFiltersAndSort();
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar las ventas. Intente nuevamente.';
        this.isLoading = false;
        console.error('Error al cargar ventas:', error);
      },
    });
  }

  // Método para abrir el escáner desde la lista
// Método para abrir el escáner desde la lista
  abrirEscaneoPendiente(sale: ventas): void {
    this.isLoading = true;
    
    this.asignacionS.verificarEstadoVenta(sale.idVenta || 0).subscribe({
      next: (response) => {
        this.isLoading = false; // Detenemos la carga de inmediato
        
        const listadoAsignacion = response.data || [];
        
        // 1. Filtramos y buscamos SOLO los productos que requieren serial
        const detallesConSerial = listadoAsignacion.filter((d: any) => d.requiereSerial);

        // 2. Si NO HAY productos que requieran código en esta venta...
        if (detallesConSerial.length === 0) {
          this.mostrarMensaje(
            'No requiere códigos', // Título claro
            `Los productos de esta venta no necesitan que se les asigne ningún código.`, // Mensaje claro
            'info'
          );
          return; // Salimos de la función, no abrimos el escáner
        }

        // 3. Si SÍ HAY productos que requieren código, preparamos el escáner
        this.esModoConsulta = detallesConSerial.every((d: any) => d.asignacionCompleta);

        this.detallesParaScan = detallesConSerial.map((d: any) => ({
          idDetalleVenta: d.idDetalle,
          idProducto: d.idProducto,
          nombre: d.nombreProducto,
          cantidad: d.cantidadRequerida,
          codigosExistentes: d.codigosAsignados || [] 
        }));

        this.mostrarScanModal = true;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al verificar seriales:', err);
        this.mostrarMensaje(
          'Error',
          'Ocurrió un problema al verificar los códigos de los productos.',
          'warning'
        );
      }
    });
  }
  onScanCompleted() {
    this.mostrarScanModal = false;
    this.listadoVetnas(); // Refrescar lista
  }
  // ... (El resto de la lógica de filtrado y paginación se mantiene igual)

  applyFiltersAndSort(): void {
    let tempVentas = [...this.allVentas];

    // 1. Filtrado por texto (ID o nombre del cliente)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      tempVentas = tempVentas.filter(
        (venta) =>
          venta.cliente?.ci.toLowerCase().includes(term) ||
          `vnt${venta.idVenta}`.toLowerCase().includes(term),
      );
    }
    

    // 2. Filtrado por estado
    if (this.filterStatus !== 'todos') {
      // Map filterStatus to venta.estado values (uppercase)
      const statusMap: { [key: string]: string } = {
        completada: 'COMPLETADA',
        pendiente: 'PENDIENTE',
        cancelada: 'CANCELADA',
      };
      const mappedStatus = statusMap[this.filterStatus];
      tempVentas = tempVentas.filter((venta) => venta.estado === mappedStatus);
    }

    // 3. Ordenamiento por fecha
    tempVentas.sort((a, b) => {
      const dateA = new Date(a.fechaVenta || '').getTime();
      const dateB = new Date(b.fechaVenta || '').getTime();
      if (this.sortDirection === 'reciente') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    this.filteredVentas = tempVentas;
    this.calculatePagination();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  get paginatedVentas(): ventas[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredVentas.slice(startIndex, endIndex);
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVentas.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.generatePaginationPages();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.generatePaginationPages();
    }
  }

  generatePaginationPages(): void {
    const pages = [];
    let startPage;
    let endPage;

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

  /**
   * @description Se ejecuta cuando el modal se oculta (sigue siendo útil para limpieza)
   */
  onModalHidden() {
    this.selecVetaEstado = null;
    console.log('Modal cerrado completamente');
  }

  // En tu list-sales.component.ts
  registrarEnvio(venta: ventas) {
    console.log('Verificando envío para la venta:', venta.idVenta);

    this.ventasS.findVentaConEnvio(venta.idVenta!).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // 🔥 CASO 1: La venta YA TIENE un envío registrado
          console.log('La venta ya tiene un envío registrado:', response.data);

          // REDIRIGIR A LA NUEVA RUTA PARA VENTAS
          this.router.navigate([
            '/home/envios/list-envios-venta',
            venta.idVenta,
          ]);
        } else {
          // 🔥 CASO 2: La venta NO TIENE envío registrado
          console.log(
            'La venta no tiene envío registrado, redirigiendo a registro...',
          );
          this.router.navigate(['/home/envios/registrarEnvio', venta.idVenta]);
        }
      },
      error: (error) => {
        console.error('Error al verificar envío de la venta:', error);

        if (error.status === 404) {
          // Error 404 = No se encontró envío, redirigir a registro
          this.router.navigate(['/home/envios/registrarEnvio', venta.idVenta]);
        } else {
          // Para otros errores, redirigir a la lista general de envíos
          alert(
            'Error al verificar el estado del envío. Serás redirigido a la lista de envíos.',
          );
          this.router.navigate(['/home/envios/list-envios']);
        }
      },
    });
  }

  async ProcesarFactura(ventaData: any): Promise<void> {
    if (!ventaData || !ventaData.venta.idVenta) return;

    if (ventaData.venta.estado !== 'COMPLETADA') {
      this.mostrarMensaje('Acción denegada', 'Solo se pueden emitir facturas para ventas en estado COMPLETADA.', 'warning');
      return;
    }

    // ADAPTADOR: Transformamos los datos de la Venta para que el PDFacturaService 
    // crea que es un Pedido y lo dibuje sin errores.
    const dataParaPDF = {
      pedido: {
        fechaPedido: ventaData.venta.fechaVenta,
        usuario: { persona: ventaData.venta.cliente.persona, username: 'Cliente en Tienda' }
      },
      detallePedidos: ventaData.detalles.map((d: any) => ({
        producto: d.producto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.cantidad * d.precioUnitario
      }))
    };

    // ¿YA EXISTE? -> IMPRIMIR
    if (this.facturaActual) {
      try {
        await this.pdfFacturaService.generarFacturaPDF(dataParaPDF, this.facturaActual);
        this.mostrarMensaje('¡Factura Descargada!', 'El documento ha sido regenerado exitosamente.', 'success');
      } catch (err) {
        this.mostrarMensaje('Error', 'No se pudo generar el archivo PDF.', 'warning');
      }
      return;
    }

    // NO EXISTE -> EMITIR
    this.procesandoFactura = true;
    const loadingModalElement = document.getElementById('loadingFacturaModal');
    if (loadingModalElement) {
        new bootstrap.Modal(loadingModalElement).show();
    }

    this.facturacionService.emitirFacturaVentaFisica(ventaData.venta.idVenta).subscribe({
      next: async (response: any) => {
        try {
          this.facturaActual = response; // Cambia el estado del botón
          await this.pdfFacturaService.generarFacturaPDF(dataParaPDF, response);
          
          if (loadingModalElement) bootstrap.Modal.getInstance(loadingModalElement)?.hide();
          this.procesandoFactura = false;
          
          this.mostrarMensaje('¡Factura Emitida!', `La factura #${response.numeroFacturaSiat} ha sido generada exitosamente.`, 'success');
        } catch (err) {
          if (loadingModalElement) bootstrap.Modal.getInstance(loadingModalElement)?.hide();
          this.procesandoFactura = false;
          this.mostrarMensaje('Aviso', 'Se emitió la factura pero falló la descarga del PDF.', 'warning');
        }
      },
      error: (err) => {
        if (loadingModalElement) bootstrap.Modal.getInstance(loadingModalElement)?.hide();
        this.procesandoFactura = false;
        const mensaje = err.error?.detalle || err.error?.mensaje || "Ocurrió un error al emitir la factura en el SIAT.";
        this.mostrarMensaje('Error SIAT', mensaje, 'warning'); 
      }
    });
  }
}
