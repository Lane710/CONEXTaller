import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../../services/Reportes/reportes.service';
import { ApiResponse } from '../../../models/api-response';
import { ReporteGananciaCombinada, ReporteGananciaPedidos, ReporteGananciaVentas, ResumenGanancias } from '../../../DTOs/dtosBD/Report/ReporteGanancia';


@Component({
  selector: 'app-reporte-ganancias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-ganancias.component.html',
  styleUrls: ['./reporte-ganancias.component.css']
})
export class ReporteGananciasComponent implements OnInit {

  // Tipos de reporte disponibles
  tiposReporte = [
    { id: 'pedidos', label: 'Pedidos Online', icon: '🛒' },
    { id: 'ventas', label: 'Ventas Tienda', icon: '🏪' },
    { id: 'combinado', label: 'Combinado', icon: '📊' },
    { id: 'resumen', label: 'Resumen Ejecutivo', icon: '📈' }
  ];

  // Filtros
  filtros = {
    fechaInicio: '',
    fechaFin: '',
    tipoReporte: 'combinado'
  };

  // Estados
  cargando = false;
  busquedaRealizada = false;
  error = '';

  // Datos de reportes
  reportePedidos: ReporteGananciaPedidos[] = [];
  reporteVentas: ReporteGananciaVentas[] = [];
  reporteCombinado: ReporteGananciaCombinada[] = [];
  reporteResumen: ResumenGanancias[] = [];

  // Estadísticas
  estadisticas = {
    totalGanancia: 0,
    totalTransacciones: 0,
    ticketPromedio: 0,
    margenPromedio: 0
  };

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.inicializarFechas();
  }

  inicializarFechas(): void {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    this.filtros.fechaFin = this.formatearFecha(hoy);
    this.filtros.fechaInicio = this.formatearFecha(primerDiaMes);
  }

  formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  validarFechas(): void {
    if (this.filtros.fechaInicio > this.filtros.fechaFin) {
      this.filtros.fechaInicio = this.filtros.fechaFin;
    }
  }

  generarReporte(): void {
    if (!this.filtros.fechaInicio || !this.filtros.fechaFin) {
      this.error = 'Por favor seleccione ambas fechas';
      return;
    }

    this.cargando = true;
    this.busquedaRealizada = true;
    this.error = '';

    switch (this.filtros.tipoReporte) {
      case 'pedidos':
        this.obtenerReportePedidos();
        break;
      case 'ventas':
        this.obtenerReporteVentas();
        break;
      case 'combinado':
        this.obtenerReporteCombinado();
        break;
      case 'resumen':
        this.obtenerReporteResumen();
        break;
    }
  }

  obtenerReportePedidos(): void {
    this.reportesService.getReporteGananciasPedidos(
      this.filtros.fechaInicio, 
      this.filtros.fechaFin
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          this.reportePedidos = res.data || [];
          this.calcularEstadisticasPedidos();
        } else {
          this.error = res.message || 'Error al obtener reporte de pedidos';
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error de conexión: ' + err.message;
        this.cargando = false;
      }
    });
  }

  obtenerReporteVentas(): void {
    this.reportesService.getReporteGananciasVentas(
      this.filtros.fechaInicio, 
      this.filtros.fechaFin
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          this.reporteVentas = res.data || [];
          this.calcularEstadisticasVentas();
        } else {
          this.error = res.message || 'Error al obtener reporte de ventas';
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error de conexión: ' + err.message;
        this.cargando = false;
      }
    });
  }

  obtenerReporteCombinado(): void {
    this.reportesService.getReporteGananciasCombinado(
      this.filtros.fechaInicio, 
      this.filtros.fechaFin
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          this.reporteCombinado = res.data || [];
          this.calcularEstadisticasCombinado();
        } else {
          this.error = res.message || 'Error al obtener reporte combinado';
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error de conexión: ' + err.message;
        this.cargando = false;
      }
    });
  }

  obtenerReporteResumen(): void {
    this.reportesService.getResumenGanancias(
      this.filtros.fechaInicio, 
      this.filtros.fechaFin
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          this.reporteResumen = res.data || [];
          this.calcularEstadisticasResumen();
        } else {
          this.error = res.message || 'Error al obtener resumen';
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error de conexión: ' + err.message;
        this.cargando = false;
      }
    });
  }

  calcularEstadisticasPedidos(): void {
    this.estadisticas.totalGanancia = this.reportePedidos.reduce((sum, item) => sum + item.gananciaNeta, 0);
    this.estadisticas.totalTransacciones = this.reportePedidos.length;
    this.estadisticas.ticketPromedio = this.reportePedidos.reduce((sum, item) => sum + item.totalPedido, 0) / this.reportePedidos.length;
    this.estadisticas.margenPromedio = this.reportePedidos.reduce((sum, item) => sum + item.margenGananciaPercent, 0) / this.reportePedidos.length;
  }

  calcularEstadisticasVentas(): void {
    this.estadisticas.totalGanancia = this.reporteVentas.reduce((sum, item) => sum + item.gananciaNeta, 0);
    this.estadisticas.totalTransacciones = this.reporteVentas.length;
    this.estadisticas.ticketPromedio = this.reporteVentas.reduce((sum, item) => sum + item.totalVenta, 0) / this.reporteVentas.length;
    this.estadisticas.margenPromedio = this.reporteVentas.reduce((sum, item) => sum + item.margenGananciaPercent, 0) / this.reporteVentas.length;
  }

  calcularEstadisticasCombinado(): void {
    this.estadisticas.totalGanancia = this.reporteCombinado.reduce((sum, item) => sum + item.gananciaNeta, 0);
    this.estadisticas.totalTransacciones = this.reporteCombinado.length;
    this.estadisticas.ticketPromedio = this.reporteCombinado.reduce((sum, item) => sum + item.totalTransaccion, 0) / this.reporteCombinado.length;
    this.estadisticas.margenPromedio = this.reporteCombinado.reduce((sum, item) => sum + item.margenGananciaPercent, 0) / this.reporteCombinado.length;
  }

  calcularEstadisticasResumen(): void {
    this.estadisticas.totalGanancia = this.reporteResumen.reduce((sum, item) => sum + item.gananciaNetaTotal, 0);
    this.estadisticas.totalTransacciones = this.reporteResumen.reduce((sum, item) => sum + item.totalTransacciones, 0);
    this.estadisticas.ticketPromedio = this.reporteResumen.reduce((sum, item) => sum + item.ticketPromedio, 0) / this.reporteResumen.length;
    this.estadisticas.margenPromedio = this.reporteResumen.reduce((sum, item) => sum + item.margenPromedio, 0) / this.reporteResumen.length;
  }

  getReporteActivo(): any[] {
    switch (this.filtros.tipoReporte) {
      case 'pedidos': return this.reportePedidos;
      case 'ventas': return this.reporteVentas;
      case 'combinado': return this.reporteCombinado;
      case 'resumen': return this.reporteResumen;
      default: return [];
    }
  }

  tieneDatos(): boolean {
    return this.getReporteActivo().length > 0;
  }

  exportarExcel(): void {
    // Implementar lógica de exportación
    alert('Funcionalidad de exportación en desarrollo');
  }

  getColorTipoVenta(tipo: string): string {
    switch (tipo) {
      case 'ONLINE': return 'badge bg-primary';
      case 'TIENDA': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }

  getTextoEstado(estado: string): string {
    const estados: { [key: string]: string } = {
      'COMPLETADO': 'Completado',
      'ENTREGADO': 'Entregado',
      'PENDIENTE': 'Pendiente',
      'CANCELADO': 'Cancelado',
      'FINALIZADO': 'Finalizado'
    };
    return estados[estado] || estado;
  }
}