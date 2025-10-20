import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { ApiResponse } from '../../../models/api-response';
import { ReportesService } from '../../../services/Reportes/reportes.service';

// =========================================================================
// ========================= 1. INTERFACES DE DATOS ========================
// =========================================================================

// DTO que devuelve la API
export interface ReporteEnvio {
  idEnvio: number;
  tipoOrigen: string;
  idOrigen: number;
  cliente: string;
  estado: string;
  metodoEnvio: string;
  costoEnvio: number;
  empresaEnvio: string;
  codigoSeguimiento: string;
  fechaCreacion: string; 
  fechaEnvio: string; 
  fechaEstimada: string; 
  fechaEntrega: string; 
}

// Interfaces para los filtros
interface FiltroOpcion {
  value: string | number;
  viewValue: string;
}
interface MetodoEnvio {
  id: number;
  nombre: string;
}


// =========================================================================
// =========================== 2. COMPONENT LOGIC ==========================
// =========================================================================

@Component({
  selector: 'app-reporte-envios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './reporte-envios.component.html',
  styleUrl: './reporte-envios.component.css'
})
export class ReporteEnviosComponent implements OnInit {

  // ================== MODELOS PARA LOS FILTROS =====================
  
  filtrosEnvios = {
    fechaInicio: '',
    fechaFin: '',
    tipoOrigen: '',
    estadoEnvio: '',
    idMetodoEnvio: '' // Usamos string para el selector
  };
  maxDate: string;

  // ============ PROPIEDADES PARA DATOS Y ESTADO DE LA VISTA ==========
  
  tiposOrigen: FiltroOpcion[] = [];
  estadosEnvio: FiltroOpcion[] = [];
  metodosEnvio: MetodoEnvio[] = [];

  reporteEnvios: ReporteEnvio[] = [];
  totalCostoEnvios: number = 0;

  cargandoReporte: boolean = false;
  busquedaRealizada: boolean = false;

  // Inyección de servicios
  constructor(private reportesService: ReportesService) {
    this.maxDate = this.getTodayAsString();
  }

  ngOnInit(): void {
    this.inicializarFechas();
    this.cargarDatosParaFiltros();
    // NOTA: El reporte NO se lanza hasta que el usuario presiona "Filtrar"
  }

  // ================== MÉTODOS DE LÓGICA DE REPORTE ===================

  aplicarFiltrosEnvios(): void {
    this.cargandoReporte = true;
    this.busquedaRealizada = true;
    this.reporteEnvios = [];
    this.totalCostoEnvios = 0;
    this.consultaReporteEnvios();
  }

  private consultaReporteEnvios(): void {
    this.validarFechas();
    
    // Convertimos idMetodoEnvio a number | undefined
    const idMetodo: number | undefined = this.filtrosEnvios.idMetodoEnvio ? 
                                          parseInt(this.filtrosEnvios.idMetodoEnvio, 10) : undefined;

    this.reportesService.findReporteEnvios(
      this.filtrosEnvios.fechaInicio,
      this.filtrosEnvios.fechaFin,
      this.filtrosEnvios.tipoOrigen || undefined,
      this.filtrosEnvios.estadoEnvio || undefined,
      idMetodo
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data) {
          this.reporteEnvios = res.data as ReporteEnvio[];
          this.calcularTotalCostoEnvios();
        } else {
          this.reporteEnvios = [];
        }
        this.cargandoReporte = false;
      },
      error: (err) => {
        console.error('Error al generar el reporte de envíos:', err);
        this.cargandoReporte = false;
      }
    });
  }

  private calcularTotalCostoEnvios(): void {
    this.totalCostoEnvios = this.reporteEnvios.reduce((acc, envio) => acc + (envio.costoEnvio || 0), 0);
  }

  // --- Métodos de utilidad y carga de filtros ---
  
  validarFechas(): void {
    if (this.filtrosEnvios.fechaInicio > this.filtrosEnvios.fechaFin) {
      this.filtrosEnvios.fechaInicio = this.filtrosEnvios.fechaFin;
    }
  }

  private inicializarFechas(): void {
    const hoy = this.getTodayAsString();
    this.filtrosEnvios.fechaFin = hoy;
    
    // Fecha de inicio por defecto (ej: hace 30 días)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    this.filtrosEnvios.fechaInicio = this.formatDate(thirtyDaysAgo);
  }
  
  private cargarDatosParaFiltros(): void {
    this.cargarTiposOrigen();
    this.cargarEstadosEnvio();
    this.cargarMetodosEnvio();
  }

  private cargarTiposOrigen(): void {
    // Los envíos pueden originarse de Pedidos o de Ventas (ejemplo común)
    this.tiposOrigen = [
      { value: 'PEDIDO', viewValue: 'Pedido' },
      { value: 'VENTA', viewValue: 'Venta Directa' }
    ];
  }

  private cargarEstadosEnvio(): void {
    // Lista completa de estados de envío
    this.estadosEnvio = [
      { value: 'PENDIENTE', viewValue: 'Pendiente' },
      { value: 'PREPARANDO', viewValue: 'Preparando' },
      { value: 'EN_TRANSITO', viewValue: 'En Tránsito' },
      { value: 'EN_REPARTO', viewValue: 'En Reparto' },
      { value: 'ENTREGADO', viewValue: 'Entregado' },
      { value: 'CANCELADO', viewValue: 'Cancelado' },
      { value: 'DEVUELTO', viewValue: 'Devuelto' }
    ];
  }

  private cargarMetodosEnvio(): void {
    // Simulación: En un proyecto real, esto vendría de un servicio de la API
    this.metodosEnvio = [
      { id: 1, nombre: 'Estándar' },
      { id: 2, nombre: 'Express 24h' },
      { id: 3, nombre: 'Recolección Local' }
    ];
  }

  private getTodayAsString(): string {
    return this.formatDate(new Date());
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}