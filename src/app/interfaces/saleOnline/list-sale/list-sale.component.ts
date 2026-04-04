import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { PedidosService } from '../../../services/PedidosEnviosDetalles/pedidos.service';
import { DatePipe, LowerCasePipe, NgClass, NgFor, NgIf, SlicePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { detallePedido } from '../../../models/PedidosEnviosDetalles/detallePedido';
import { DetallePedidosService } from '../../../services/PedidosEnviosDetalles/detalle-pedidos.service';
import { lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { AsignacionUnidadesService } from '../../../services/ProductosServis/asignacion-unidades.service';
import { ModalScanComponent } from '../../storeSale/sales/modal-scan.component';
import { FacturacionService } from '../../../services/Facturacion/facturacion.service';
import { PDFacturaService } from '../../../services/Facturacion/PDFacturacion.service';


declare var bootstrap: any;

interface PedidoConDetalles {
  pedido: pedidos;
  detallePedidos: detallePedido[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-list-pedido',
  standalone: true,
  imports: [NgFor, FormsModule, NgClass, NgIf, DatePipe, TitleCasePipe, LowerCasePipe, SlicePipe, ModalScanComponent],
  templateUrl: './list-sale.component.html',
  styleUrls: ['./list-sale.component.css'],
})
export class ListPedidoComponent implements OnInit, AfterViewInit {
  // --- REFERENCIAS DE MODALES ---
  @ViewChild('mensajeGeneralModal') mensajeGeneralModalRef!: ElementRef;
  private mensajeGeneralModalInstance: any;

  // --- VARIABLES PARA EL ESCÁNER ---
  mostrarScanModal: boolean = false;
  detallesParaScan: any[] = [];
  esModoConsulta: boolean = false;
  
  mensajeModal = {
    titulo: 'Información',
    texto: '',
    tipo: 'info' 
  };

  pedidos: pedidos[] = [];
  pedidosOriginal: pedidos[] = [];
  allPedidosConDetalles: PedidoConDetalles[] = [];
  filteredPedidosConDetalles: PedidoConDetalles[] = [];
// --- VARIABLES DE CONTROL NUEVAS ---
pedidoEnDespachoId: number | null = null;

  currentPage = 1;
  itemsPerPage = 7;
  totalPages = 0;
  pages: number[] = [];
  private readonly pagesToShow = 5;

  searchText = '';
  filterStatus: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO' | 'todos' = 'todos';
  sortDirection: 'reciente' | 'antiguo' = 'reciente';
  razonCancelacion: string = ''; // <-- NUEVA VARIABLE

//facturacion
procesandoFactura: boolean = false;
facturaActual: any = null; // <-- NUEVO: Guarda los datos de la factura si ya existe
  verificandoFactura: boolean = false;

  pedidoSeleccionado: PedidoConDetalles | null = null;
  pedidoParaCancelar: pedidos | null = null;
  estadoSeleccionado = '';

  constructor(
    private pedidosS: PedidosService,
    private detallePedidoS: DetallePedidosService,
    private asignacionS: AsignacionUnidadesService, // <-- NUEVO
    private router: Router,
    private cdRef: ChangeDetectorRef, // <-- NUEVO
    private facturacionService: FacturacionService, // INYECTAR
    private pdfFacturaService: PDFacturaService,
    
  ) {}

  ngOnInit(): void {
    this.listadoPedidos();
  }

  ngAfterViewInit(): void {
    if (this.mensajeGeneralModalRef) {
      this.mensajeGeneralModalInstance = new bootstrap.Modal(this.mensajeGeneralModalRef.nativeElement);
    }
  }

  // ==========================================
  // --- LÓGICA DE ESCANEO Y MENSAJES ---
  // ==========================================

  mostrarMensaje(titulo: string, texto: string, tipo: 'success' | 'warning' | 'info' = 'info') {
    this.mensajeModal = { titulo, texto, tipo };
    this.cdRef.detectChanges(); 
    
    if (!this.mensajeGeneralModalInstance) {
      const modalElement = document.getElementById('modalMensajeGeneral');
      if (modalElement) {
        this.mensajeGeneralModalInstance = new bootstrap.Modal(modalElement);
      }
    }
    
    if (this.mensajeGeneralModalInstance) {
      this.mensajeGeneralModalInstance.show();
    }
  }

  cerrarMensajeModal() {
    if (this.mensajeGeneralModalInstance) {
      this.mensajeGeneralModalInstance.hide();
    }
  }

  abrirEscaneoPendiente(item: PedidoConDetalles): void {
    const idPedido = item.pedido.idPedido || 0;
    
    this.asignacionS.verificarEstadoPedido(idPedido).subscribe({
      next: (response) => {
        const listadoAsignacion = response.data || [];
        
        // 1. Filtramos solo los que requieren serial
        const detallesConSerial = listadoAsignacion.filter((d: any) => d.requiereSerial);

        // 2. Si no hay productos que requieran código
        if (detallesConSerial.length === 0) {
          this.mostrarMensaje(
            'No requiere códigos', 
            `Los productos del pedido #PED${idPedido} no necesitan que se les asigne ningún código de serie.`, 
            'info'
          );
          return; 
        }
        

        // 3. Preparamos datos para el modal
        this.esModoConsulta = detallesConSerial.every((d: any) => d.asignacionCompleta);
        this.detallesParaScan = detallesConSerial.map((d: any) => ({
          idDetalleVenta: d.idDetalle, // Reciclamos esta propiedad para el modal
          idProducto: d.idProducto,
          nombre: d.nombreProducto,
          cantidad: d.cantidadRequerida,
          codigosExistentes: d.codigosAsignados || [] 
        }));

        this.mostrarScanModal = true;
      },
      error: (err) => {
        console.error('Error al verificar seriales:', err);
        this.mostrarMensaje('Error', 'Ocurrió un problema al verificar los códigos de los productos.', 'warning');
      }
    });
  }

 onScanCompleted(): void {
  this.mostrarScanModal = false;
  
  // Si veníamos de un flujo de despacho, ahora confirmamos en el backend
  if (this.pedidoEnDespachoId) {
    this.ejecutarDespachoBackend(this.pedidoEnDespachoId);
    this.pedidoEnDespachoId = null; // Limpiar para futuros usos
  } else {
    // Si solo era vista, refrescamos
    this.listadoPedidos(); 
  }
}

ejecutarDespachoBackend(idPedido: number): void {
  // Corregido: Ahora llama a confirmarYDespachar (como está en el service)
  this.pedidosS.confirmarYDespachar(idPedido).subscribe({
    next: () => {
      this.mostrarMensaje('Éxito', 'Pedido despachado y entregado exitosamente.', 'success');
      this.listadoPedidos(); // Refrescar lista final
    },
    error: (err) => {
      console.error('Error al despachar en backend:', err);
      this.mostrarMensaje('Error', 'No se pudo despachar el pedido o hubo un problema de stock.', 'warning');
    }
  });
}
  // ==========================================
  // --- LÓGICA DE LISTADO Y PAGINACIÓN ---
  // ==========================================

  get filteredAndPaginatedPedidos(): PedidoConDetalles[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPedidosConDetalles.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1; 
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let tempPedidos = [...this.allPedidosConDetalles];

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      tempPedidos = tempPedidos.filter((item) => {
        const pedidoIdStr = `ped${item.pedido.idPedido}`.toLowerCase();
        if (pedidoIdStr.includes(term)) return true;

        const userName = item.pedido.usuario?.username?.toLowerCase() || '';
        if (userName.includes(term)) return true;

        return item.detallePedidos.some((detalle) =>
          detalle.producto?.nombre?.toLowerCase().includes(term)
        );
      });
    }

    if (this.filterStatus !== 'todos') {
      tempPedidos = tempPedidos.filter(
        (item) => item.pedido.estado === this.filterStatus
      );
    }

    tempPedidos.sort((a, b) => {
      const dateA = new Date(a.pedido.fechaPedido || '').getTime();
      const dateB = new Date(b.pedido.fechaPedido || '').getTime();
      return this.sortDirection === 'reciente' ? dateB - dateA : dateA - dateB;
    });

    this.filteredPedidosConDetalles = tempPedidos;
    this.updatePagination();
  }

  onSearch(): void {
    this.currentPage = 1; 
    this.applyFiltersAndSort();
  }

  listadoPedidos(): void {
    this.pedidosS.finAll().subscribe({
      next: (response) => {
        this.pedidosOriginal = response.data;
        this.getAllDetallesPedidos(this.pedidosOriginal);
      },
      error: (error) => console.error('Error al obtener pedidos:', error),
    });
  }

  getAllDetallesPedidos(pedidos: pedidos[]): void {
    const promises = pedidos.map((pedido) =>
      lastValueFrom(this.detallePedidoS.getById(pedido.idPedido || 0))
        .then((response) => ({
          pedido,
          detallePedidos: (response.data || []).filter((detalle: null) => detalle !== null),
          isExpanded: false,
        }))
        .catch((error) => {
          console.error(`Error al obtener detalles del pedido ${pedido.idPedido}:`, error);
          return null;
        })
    );

    Promise.all(promises)
      .then((allDetails) => {
        this.allPedidosConDetalles = (allDetails.filter(
          (item) => item !== null && item.detallePedidos !== undefined
        ) as unknown) as PedidoConDetalles[];
        this.applyFiltersAndSort();
      })
      .catch((error) => console.error('Error al obtener todos los detalles:', error));
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPedidosConDetalles.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
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
    const pages: number[] = [];
    let startPage, endPage;
    const middle = Math.floor(this.pagesToShow / 2);

    if (this.totalPages <= this.pagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else if (this.currentPage <= middle) {
      startPage = 1;
      endPage = this.pagesToShow;
    } else if (this.currentPage + middle >= this.totalPages) {
      startPage = this.totalPages - this.pagesToShow + 1;
      endPage = this.totalPages;
    } else {
      startPage = this.currentPage - middle;
      endPage = this.currentPage + middle;
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    this.pages = pages;
  }

  ordenarPorFechaReciente(): void {
    this.sortDirection = 'reciente';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  ordenarPorFechaAntigua(): void {
    this.sortDirection = 'antiguo';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

 selectPedidoModalDetalle(item: PedidoConDetalles): void {
    this.pedidoSeleccionado = item;
    this.facturaActual = null; // Reseteamos al abrir el modal

    // Si el pedido está ENTREGADO, verificamos si ya tiene factura en la BD
    if (item.pedido.estado === 'ENTREGADO') {
      this.verificandoFactura = true;
      this.facturacionService.obtenerFacturaPedido(item.pedido.idPedido!).subscribe({
        next: (factura) => {
          this.facturaActual = factura; // Ya existe, el botón cambiará a "Imprimir"
          this.verificandoFactura = false;
        },
        error: () => {
          // Si da error (404), significa que no hay factura. El botón dirá "Generar"
          this.facturaActual = null;
          this.verificandoFactura = false;
        }
      });
    }
  }
  abrirModalCambiarEstado(pedido: PedidoConDetalles): void {
    this.pedidoSeleccionado = pedido;
    this.estadoSeleccionado = pedido.pedido.estado || '';
    const modalElement = document.getElementById('modalCambiarEstado');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }
confirmarCambioEstado(): void {
  if (!this.pedidoSeleccionado || !this.estadoSeleccionado || !this.pedidoSeleccionado.pedido.idPedido) return;

  const idPedido = this.pedidoSeleccionado.pedido.idPedido;
  const estadoActual = this.pedidoSeleccionado.pedido.estado;

  if (this.estadoSeleccionado === 'ENTREGADO') {
    this.cerrarModal('modalCambiarEstado');

    // SOLUCIÓN AL ERROR: Identificamos si solo quiere "VER" o si quiere "DESPACHAR"
    if (estadoActual === 'ENTREGADO') {
      this.procesarFlujoDespacho(idPedido, true); // true = Modo vista/lectura
    } else {
      this.procesarFlujoDespacho(idPedido, false); // false = Modo despacho/descuento de stock
    }
  } else {
    // Lógica normal para estados como PENDIENTE o CANCELADO
    this.pedidosS.actualizarEstado(idPedido, this.estadoSeleccionado).subscribe({
      next: () => {
        this.cerrarModal('modalCambiarEstado');
        this.listadoPedidos(); 
      },
      error: (error) => console.error('Error al actualizar el estado:', error),
    });
  }
}

procesarFlujoDespacho(idPedido: number, modoSoloLectura: boolean): void {
  this.asignacionS.verificarEstadoPedido(idPedido).subscribe({
    next: (response) => {
      const listadoAsignacion = response.data || [];
      const detallesConSerial = listadoAsignacion.filter((d: any) => d.requiereSerial);

      // CASO 1: NO requiere códigos
      if (detallesConSerial.length === 0) {
        if (modoSoloLectura) {
          this.mostrarMensaje('Información', `Los productos del pedido #PED${idPedido} no necesitan códigos de serie.`, 'info');
        } else {
          // Si es despacho, descuenta stock y cambia estado directo sin abrir modal
          this.ejecutarDespachoBackend(idPedido);
        }
        return;
      }

      // CASO 2: SÍ requiere códigos
      const todoAsignado = detallesConSerial.every((d: any) => d.asignacionCompleta);

      // Si ya los pusieron antes y estamos despachando
      if (todoAsignado && !modoSoloLectura) {
        this.ejecutarDespachoBackend(idPedido);
        return;
      }

      // CASO 3: Faltan códigos por poner (o solo estamos mirando)
      this.esModoConsulta = modoSoloLectura || (todoAsignado && modoSoloLectura);
      // Solo guardamos el ID si el modal se abre para despachar
      this.pedidoEnDespachoId = modoSoloLectura ? null : idPedido;

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
      console.error('Error al verificar seriales:', err);
      this.mostrarMensaje('Error', 'Ocurrió un problema al verificar los códigos de los productos.', 'warning');
    }
  });
}


  abrirModalCancelarPedido(pedido: pedidos): void {
    this.pedidoParaCancelar = pedido;
    this.razonCancelacion = '';
    const modalElement = document.getElementById('modalConfirmarCancelacion');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

confirmarCancelacion(): void {
    // Validamos que haya un pedido y que la razón no esté vacía
    if (this.pedidoParaCancelar && this.pedidoParaCancelar.idPedido && this.razonCancelacion.trim()) {
      
      // Usamos el NUEVO método del servicio
      this.pedidosS.cancelarPedidoConRazon(this.pedidoParaCancelar.idPedido, this.razonCancelacion).subscribe({
        next: () => {
          this.mostrarMensaje('Cancelado', `El pedido #PED${this.pedidoParaCancelar?.idPedido} ha sido cancelado exitosamente.`, 'success');
          this.cerrarModal('modalConfirmarCancelacion');
          this.listadoPedidos(); 
          this.pedidoParaCancelar = null;
          this.razonCancelacion = ''; // <-- Limpiar la variable tras el éxito
        },
        error: (error) => {
          console.error('Error al cancelar el pedido:', error);
          this.mostrarMensaje('Error', 'Hubo un problema al intentar cancelar el pedido.', 'warning');
          this.cerrarModal('modalConfirmarCancelacion');
        },
      });
    }
  }

  cerrarModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
  }

  sortByEstado = (a: detallePedido, b: detallePedido) => {
    if (a.estado === 'CANCELADO' && b.estado !== 'CANCELADO') return 1;
    if (a.estado !== 'CANCELADO' && b.estado === 'CANCELADO') return -1;
    return 0;
  };

  trackByDetalleId(index: number, detalle: detallePedido): number {
    return detalle?.idDetallePedido || index;
  }

  verEnvio(detalle: PedidoConDetalles): void {
    this.router.navigate(['/home/envios/list-envios', detalle.pedido.idPedido]);
  }

async ProcesarFactura(pedidoData: PedidoConDetalles): Promise<void> {
    if (!pedidoData || !pedidoData.pedido.idPedido) return;

    // 1. VALIDACIÓN ESTRICTA: No facturar si es PENDIENTE o CANCELADO
    if (pedidoData.pedido.estado !== 'ENTREGADO') {
      this.mostrarMensaje(
        'Acción denegada', 
        'Solo se pueden emitir facturas para pedidos en estado ENTREGADO.', 
        'warning'
      );
      return;
    }

    // 2. ¿YA EXISTE LA FACTURA? -> SOLO IMPRIMIR
    if (this.facturaActual) {
      try {
        await this.pdfFacturaService.generarFacturaPDF(pedidoData, this.facturaActual);
        this.mostrarMensaje('¡Factura Descargada!', 'La representación gráfica ha sido regenerada exitosamente.', 'success');
      } catch (err) {
        this.mostrarMensaje('Error', 'No se pudo generar el archivo PDF.', 'warning');
      }
      return; // Detenemos aquí, no llamamos al SIAT
    }

    // 3. NO EXISTE -> EMITIR NUEVA FACTURA AL SIAT
    this.procesandoFactura = true;
    const loadingModalElement = document.getElementById('loadingFacturaModal');
    const loadingModal = new bootstrap.Modal(loadingModalElement);
    loadingModal.show();

    this.facturacionService.emitirFacturaPedidoOnline(pedidoData.pedido.idPedido).subscribe({
      next: async (response: any) => {
        try {
          this.facturaActual = response; // Guardamos la data para que el botón cambie a "Imprimir" sin cerrar el modal
          await this.pdfFacturaService.generarFacturaPDF(pedidoData, response);
          
          loadingModal.hide();
          this.procesandoFactura = false;
          
          // Mensaje de éxito reemplazando al alert()
          this.mostrarMensaje(
            '¡Factura Emitida!', 
            `La factura #${response.numeroFacturaSiat} se generó en el SIAT y se descargó exitosamente.`, 
            'success'
          );
        } catch (err) {
          loadingModal.hide();
          this.procesandoFactura = false;
          this.mostrarMensaje('Aviso', 'Se emitió la factura pero falló la descarga del PDF.', 'warning');
        }
      },
      error: (err) => {
        loadingModal.hide();
        this.procesandoFactura = false;
        const mensaje = err.error?.detalle || err.error?.mensaje || "Ocurrió un error al emitir la factura.";
        this.mostrarMensaje('Error SIAT', mensaje, 'warning'); 
      }
    });
  }
}