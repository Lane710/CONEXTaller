import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
// Asume que estas rutas son correctas en tu proyecto
import { forma_pago } from '../../../models/PedidosEnviosDetalles/forma_pago'; 
import { ApiResponse } from '../../../models/api-response';
import { ReportesService } from '../../../services/Reportes/reportes.service';
import { ReportePedido } from '../../../DTOs/dtosBD/Report/ReportePedido';

// NOTA: Asumo que tienes un DTO para Pedido similar al de Venta



// --- INTERFACES PARA LA ESTRUCTURA AGRUPADA DE PEDIDOS (Listado) ---
interface DetallePedidoAgrupado {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoAgrupado {
  idPedido: number;
  fechaPedido: string;
  horaPedido: string;
  cliente: string;
  formaPago: string;
  estado: string;
  totalNeto: number; // Será el total de la suma de todos los detalles
  detalles: DetallePedidoAgrupado[];
}

// Interfaces para los filtros
interface EstadoPedido {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-reporte-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-pedidos.component.html',
  styleUrl: './reporte-pedidos.component.css'
})
export class ReportePedidosComponent implements OnInit {

  // =================================================================
  // ================== MODELOS PARA LOS FILTROS =====================
  // =================================================================
  
  filtrosPedidos = {
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    // La entrada del selector es string, aunque la API requiera number (o null/undefined)
    formaPagoId: '', 
    usernameCliente: ''
  };
  maxDate: string;

  // =================================================================
  // ============ PROPIEDADES PARA DATOS Y ESTADO DE LA VISTA ==========
  // =================================================================
  
  estadosPedido: EstadoPedido[] = [];
  formasDePago: forma_pago[] = [];

  reportePedidosAgrupado: PedidoAgrupado[] = [];
  totalGeneralPedidos: number = 0;

  cargandoReporte: boolean = false;
  busquedaRealizada: boolean = false;

  // Inyección de servicios
  constructor(
    private reportesService: ReportesService 
  ) {
    this.maxDate = this.getTodayAsString();
  }

  ngOnInit(): void {
    this.inicializarFiltrosDePedidos();
    this.cargarDatosParaFiltrosDePedidos();
  }

  // =================================================================
  // ================== MÉTODOS DE LÓGICA DE REPORTE ===================
  // =================================================================

  aplicarFiltrosPedidos(): void {
    this.cargandoReporte = true;
    this.busquedaRealizada = true;
    this.reportePedidosAgrupado = [];
    this.totalGeneralPedidos = 0;
    this.consultaReportePedidos();
  }

  private consultaReportePedidos(): void {
    // CORRECCIÓN DE TIPADO: Ahora la variable idPago permite 'number | undefined'
    const idPago: number | undefined = this.filtrosPedidos.formaPagoId 
      ? parseInt(this.filtrosPedidos.formaPagoId, 10) 
      : undefined;

    const cliente: string | undefined = this.filtrosPedidos.usernameCliente || undefined;


    this.reportesService.findReportePedidos(
      this.filtrosPedidos.fechaInicio,
      this.filtrosPedidos.fechaFin,
      this.filtrosPedidos.estado,
      idPago, // Enviamos number | undefined (API lo acepta)
      cliente // Enviamos string | undefined
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data) {
          this.reportePedidosAgrupado = this.agruparPedidosPorId(res.data);
          this.calcularTotalGeneralPedidos();
          console.log('Reporte de pedidos AGRUPADO:', this.reportePedidosAgrupado);
        } else {
          this.reportePedidosAgrupado = [];
        }
        this.cargandoReporte = false;
      },
      error: (err) => {
        console.error('Error al generar el reporte de pedidos:', err);
        this.cargandoReporte = false;
      }
    });
  }

  /**
   * Transforma la lista plana de reportes en una lista agrupada por idPedido.
   * La lógica es idéntica a la de Ventas.
   */
  private agruparPedidosPorId(reportePlano: ReportePedido[]): PedidoAgrupado[] {
    const mapaPedidos = new Map<number, PedidoAgrupado>();

    reportePlano.forEach(item => {
      if (!mapaPedidos.has(item.idPedido)) {
        mapaPedidos.set(item.idPedido, {
          idPedido: item.idPedido,
          fechaPedido: item.fechaPedido,
          horaPedido: '',
          cliente: item.cliente, 
          formaPago: item.formaPago,
          estado: item.estado,
          totalNeto: 0, // Inicializamos a 0 y lo calculamos al final
          detalles: []
        });
      }

      mapaPedidos.get(item.idPedido)!.detalles.push({
        producto: item.producto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      });
    });

    // Recorremos el mapa y recalculamos el totalNeto sumando los subtotales de los detalles.
    return Array.from(mapaPedidos.values()).map(pedido => ({
      ...pedido,
      totalNeto: pedido.detalles.reduce((sum, d) => sum + d.subtotal, 0)
    }));
  }

  private calcularTotalGeneralPedidos(): void {
    this.totalGeneralPedidos = this.reportePedidosAgrupado.reduce((acc, pedido) => acc + pedido.totalNeto, 0);
  }

  // --- Métodos de utilidad y carga de filtros ---
  
  validarFechas(): void {
    if (this.filtrosPedidos.fechaInicio > this.filtrosPedidos.fechaFin) {
      this.filtrosPedidos.fechaInicio = this.filtrosPedidos.fechaFin;
    }
  }

  private inicializarFiltrosDePedidos(): void {
    const hoy = this.getTodayAsString();
    this.filtrosPedidos.fechaInicio = hoy;
    this.filtrosPedidos.fechaFin = hoy;
    this.filtrosPedidos.usernameCliente = ''; 
  }
  
  private cargarDatosParaFiltrosDePedidos(): void {
    this.cargarEstadosDePedido();
    this.cargarFormasDePago();
  }

  private cargarEstadosDePedido(): void {
    this.estadosPedido = [
      { value: 'PROCESANDO', viewValue: 'Procesando' },
      { value: 'ENVIADO', viewValue: 'Enviado' },
      { value: 'COMPLETADA', viewValue: 'completada' },
      { value: 'CANCELADO', viewValue: 'Cancelado' }
    ];
  }

  private cargarFormasDePago(): void {
    // Simulando formas de pago (usar la lógica real de tu servicio si existe)
    this.formasDePago = [
      { idFormaPago: 1111, nombre: 'efectivo', estado: 'activo' } as forma_pago,
      { idFormaPago: 3333, nombre: 'Transferencia por QR', estado: 'activo' } as forma_pago
    ];
  }

  private getTodayAsString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}