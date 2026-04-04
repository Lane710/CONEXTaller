import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../../services/Reportes/reportes.service';
import { ApiResponse } from '../../../models/api-response';
import { PdfGeneratorService } from '../../../services/pdf-generator/pdf-generator.service';
@Component({
  selector: 'app-reporte-ganancias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-ganancias.component.html',
  styleUrls: ['./reporte-ganancias.component.css']
})
export class ReporteGananciasComponent implements OnInit {

  // --- Tipos de reporte extendidos (Ganancias + Tendencias) ---
  tiposReporte = [
    { id: 'combinado', label: 'Ganancias: Combinado (Tienda + Web)', icon: '📊' },
    { id: 'pedidos', label: 'Ganancias: Pedidos Online', icon: '🛒' },
    { id: 'ventas', label: 'Ganancias: Ventas Tienda', icon: '🏪' },
    // { id: 'resumen', label: 'Ganancias: Resumen Ejecutivo', icon: '📈' },
    // { id: 'tendencia_categorias', label: 'Tendencias: Por Categoría', icon: '🏷️' },
    // { id: 'tendencia_dia_hora', label: 'Tendencias: Mapa de Calor (Día/Hora)', icon: '🕒' },
    // { id: 'tendencia_estacionalidad', label: 'Tendencias: Estacionalidad Anual', icon: '📅' },
    // { id: 'tendencia_estados', label: 'Tendencias: Estado de Transacciones', icon: '✅' },
    // { id: 'tendencia_metodos', label: 'Tendencias: Métodos de Pago', icon: '💳' }
  ];

  filtros = {
    fechaInicio: '',
    fechaFin: '',
    tipoReporte: 'combinado',
    anioActual: new Date().getFullYear(),
    anioPasado: new Date().getFullYear() - 1
  };

  cargando = false;
  busquedaRealizada = false;
  error = '';

  // Arrays para almacenar los datos
  reportePedidos: any[] = [];
  reporteVentas: any[] = [];
  reporteCombinado: any[] = [];
  reporteResumen: any[] = [];
  
  // Arrays para las nuevas tendencias
  reporteCategorias: any[] = [];
  reporteDiaHora: any[] = [];
  reporteEstacionalidad: any[] = [];
  reporteEstados: any[] = [];
  reporteMetodos: any[] = [];

  estadisticas = { totalGanancia: 0, totalTransacciones: 0, ticketPromedio: 0, margenPromedio: 0 };

  constructor(private reportesService: ReportesService,private pdfGenerator: PdfGeneratorService) {}

  ngOnInit(): void {
    this.inicializarFechas();
  }

  inicializarFechas(): void {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.filtros.fechaFin = this.formatearFecha(hoy);
    this.filtros.fechaInicio = this.formatearFecha(primerDiaMes);
  }

  formatearFecha(fecha: Date): string { return fecha.toISOString().split('T')[0]; }

  validarFechas(): void {
    if (this.filtros.fechaInicio > this.filtros.fechaFin) {
      this.filtros.fechaInicio = this.filtros.fechaFin;
    }
  }

  generarReporte(): void {
    // Si NO es estacionalidad, validamos fechas normales
    if (this.filtros.tipoReporte !== 'tendencia_estacionalidad') {
      if (!this.filtros.fechaInicio || !this.filtros.fechaFin) {
        this.error = 'Por favor seleccione ambas fechas'; return;
      }
    } else {
      if (!this.filtros.anioActual || !this.filtros.anioPasado) {
        this.error = 'Por favor indique los años a comparar'; return;
      }
    }

    this.cargando = true;
    this.busquedaRealizada = true;
    this.error = '';

    // Limpiamos todo
    this.reportePedidos = []; this.reporteVentas = []; this.reporteCombinado = []; 
    this.reporteResumen = []; this.reporteCategorias = []; this.reporteDiaHora = [];
    this.reporteEstacionalidad = []; this.reporteEstados = []; this.reporteMetodos = [];

    // Rutero lógico
    switch (this.filtros.tipoReporte) {
      // Ganancias (Ya existían)
      case 'pedidos': this.obtenerReportePedidos(); break;
      case 'ventas': this.obtenerReporteVentas(); break;
      case 'combinado': this.obtenerReporteCombinado(); break;
      case 'resumen': this.obtenerReporteResumen(); break;
      
      // Nuevos (Tendencias)
      case 'tendencia_categorias': this.obtenerTendenciaCategorias(); break;
      case 'tendencia_dia_hora': this.obtenerTendenciaDiaHora(); break;
      case 'tendencia_estacionalidad': this.obtenerTendenciaEstacionalidad(); break;
      case 'tendencia_estados': this.obtenerTendenciaEstados(); break;
      case 'tendencia_metodos': this.obtenerTendenciaMetodos(); break;
    }
  }

  // =================================================================================
  // MÉTODOS EXISTENTES (Mantengo la estructura, acortados por legibilidad)
  // =================================================================================
  obtenerReportePedidos(): void {
    this.reportesService.getReporteGananciasPedidos(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) { this.reportePedidos = res.data || []; this.calcularEstadisticasPedidos(); } 
        else { this.error = res.message; }
        this.cargando = false;
      }, error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  obtenerReporteVentas(): void {
    this.reportesService.getReporteGananciasVentas(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) { this.reporteVentas = res.data || []; this.calcularEstadisticasVentas(); } 
        else { this.error = res.message; }
        this.cargando = false;
      }, error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  obtenerReporteCombinado(): void {
    this.reportesService.getReporteGananciasCombinado(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) { this.reporteCombinado = res.data || []; this.calcularEstadisticasCombinado(); } 
        else { this.error = res.message; }
        this.cargando = false;
      }, error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  obtenerReporteResumen(): void {
    this.reportesService.getResumenGanancias(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) { this.reporteResumen = res.data || []; this.calcularEstadisticasResumen(); } 
        else { this.error = res.message; }
        this.cargando = false;
      }, error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  // =================================================================================
  // NUEVOS MÉTODOS DE TENDENCIAS
  // =================================================================================
  obtenerTendenciaCategorias(): void {
    this.reportesService.getVentasPorCategoria(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (res) => { if(res.success) this.reporteCategorias = res.data || []; this.cargando = false; },
      error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  obtenerTendenciaDiaHora(): void {
    this.reportesService.getTransaccionesPorDiaYHora(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (res) => { if(res.success) this.reporteDiaHora = res.data || []; this.cargando = false; },
      error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  obtenerTendenciaEstacionalidad(): void {
    this.reportesService.getEstacionalidad(this.filtros.anioActual, this.filtros.anioPasado).subscribe({
      next: (res) => { if(res.success) this.reporteEstacionalidad = res.data || []; this.cargando = false; },
      error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  obtenerTendenciaEstados(): void {
    this.reportesService.getResumenPorEstado(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (res) => { if(res.success) this.reporteEstados = res.data || []; this.cargando = false; },
      error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  obtenerTendenciaMetodos(): void {
    this.reportesService.getResumenMetodosPago(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (res) => { if(res.success) this.reporteMetodos = res.data || []; this.cargando = false; },
      error: (err) => { this.error = err.message; this.cargando = false; }
    });
  }

  // =================================================================================
  // UTILS
  // =================================================================================
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
      case 'tendencia_categorias': return this.reporteCategorias;
      case 'tendencia_dia_hora': return this.reporteDiaHora;
      case 'tendencia_estacionalidad': return this.reporteEstacionalidad;
      case 'tendencia_estados': return this.reporteEstados;
      case 'tendencia_metodos': return this.reporteMetodos;
      default: return [];
    }
  }

  tieneDatos(): boolean {
    return this.getReporteActivo().length > 0;
  }

  exportarExcel(): void { alert('Funcionalidad de exportación en desarrollo'); }

  getColorTipoVenta(tipo: string): string {
    return tipo === 'ONLINE' ? 'badge bg-primary' : 'badge bg-success';
  }

  getTextoEstado(estado: string): string {
    const estados: { [key: string]: string } = { 'COMPLETADO': 'Completado', 'ENTREGADO': 'Entregado', 'PENDIENTE': 'Pendiente', 'CANCELADO': 'Cancelado' };
    return estados[estado] || estado;
  }
  
  // Utilidad para obtener nombre del mes en texto
  getNombreMes(numeroMes: number): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[numeroMes - 1] || 'Desconocido';
  }

  

  // =================================================================================
  // EXPORTACIÓN A PDF
  // =================================================================================
  exportarPDF(): void {
    // 1. Obtenemos los datos de la tabla que se está viendo actualmente
    const datosTabla = this.getReporteActivo();
    
    // 2. Buscamos el nombre bonito del reporte (ej: "Ganancias: Combinado (Tienda + Web)")
    const tipoReporteObj = this.tiposReporte.find(t => t.id === this.filtros.tipoReporte);
    const nombreReporteTexto = tipoReporteObj ? tipoReporteObj.label : 'General';

    // 3. Le pasamos toda la información a nuestro servicio profesional
    this.pdfGenerator.exportarReporteGanancias(
      datosTabla,
      this.estadisticas,
      this.filtros,
      nombreReporteTexto
    );
  }
}