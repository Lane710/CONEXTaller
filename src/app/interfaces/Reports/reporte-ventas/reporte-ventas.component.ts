import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { forma_pago } from '../../../models/PedidosEnviosDetalles/forma_pago'; 
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { ApiResponse } from '../../../models/api-response';
import { ReportesService } from '../../../services/Reportes/reportes.service';
import { PdfGeneratorService } from '../../../services/pdf-generator/pdf-generator.service';

// --- INTERFACES PARA LA ESTRUCTURA AGRUPADA ---
export interface DetalleVentaAgrupado {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaAgrupada {
  idVenta: number;
  fechaVenta: string;
  horaVenta: string;
  cliente: string;
  empleado: string;
  formaPago: string;
  estado: string;
  total: number;
  descuento: number;
  totalNeto: number;
  detalles: DetalleVentaAgrupado[];
}

interface EstadoVenta {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-ventas.component.html',
  styleUrl: './reporte-ventas.component.css'
})
export class ReporteVentasComponent implements OnInit {
  
  // =================================================================
  // ================== MODELOS PARA LOS FILTROS =====================
  // =================================================================
  filtrosVentas = {
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    formaPagoId: '', 
    trabajadorUsername: ''
  };
  maxDate: string;

  // =================================================================
  // ============ PROPIEDADES PARA DATOS Y ESTADO DE LA VISTA ==========
  // =================================================================
  estadosVenta: EstadoVenta[] = [];
  trabajadoresVentas: any[] = [];
  formasDePago: forma_pago[] = [];

  reporteVentasAgrupado: VentaAgrupada[] = [];
  totalGeneralVentas: number = 0;

  cargandoReporte: boolean = false;
  busquedaRealizada: boolean = false;

  constructor(
    private usuariosService: UsuariosService, 
    private reportesService: ReportesService,
    private pdfGenerator: PdfGeneratorService
  ) {
    this.maxDate = this.getTodayAsString();
  }

  ngOnInit(): void {
    this.inicializarFiltrosDeVentas();
    this.cargarDatosParaFiltrosDeVentas();
  }

  // =================================================================
  // ================== MÉTODOS DE LÓGICA DE REPORTE ===================
  // =================================================================

  aplicarFiltrosVentas(): void {
    this.cargandoReporte = true;
    this.busquedaRealizada = true;
    this.reporteVentasAgrupado = [];
    this.totalGeneralVentas = 0;
    this.consultaReporteVentas();
  }

  private consultaReporteVentas(): void {
    // Validamos las fechas antes de enviar la petición
    this.validarFechas();

    // Enviamos 'undefined' si el filtro está vacío para que el backend lo ignore correctamente
    const estado = this.filtrosVentas.estado || undefined;
    const pagoId = this.filtrosVentas.formaPagoId || undefined;
    const trabajador = this.filtrosVentas.trabajadorUsername || undefined;

    this.reportesService.findReporteVentas(
      this.filtrosVentas.fechaInicio,
      this.filtrosVentas.fechaFin,
      estado,
      pagoId,
      trabajador
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data && Array.isArray(res.data)) {
          this.reporteVentasAgrupado = this.agruparVentasPorId(res.data);
          this.calcularTotalGeneralVentas();
        } else {
          this.reporteVentasAgrupado = [];
          this.totalGeneralVentas = 0;
        }
        this.cargandoReporte = false;
      },
      error: (err) => {
        console.error('Error al generar el reporte de ventas:', err);
        this.cargandoReporte = false;
        this.reporteVentasAgrupado = [];
      }
    });
  }

  private agruparVentasPorId(reportePlano: any[]): VentaAgrupada[] {
    const mapaVentas = new Map<number, VentaAgrupada>();

    reportePlano.forEach(item => {
      if (!mapaVentas.has(item.idVenta)) {
        mapaVentas.set(item.idVenta, {
          idVenta: item.idVenta,
          fechaVenta: item.fechaVenta,
          horaVenta: item.horaVenta,
          cliente: item.cliente,
          empleado: item.empleado,
          formaPago: item.formaPago,
          estado: item.estado,
          total: Number(item.total) || 0,
          descuento: Number(item.descuento) || 0,
          totalNeto: Number(item.totalNeto) || 0,
          detalles: [] 
        });
      }

      // Evitamos añadir detalles vacíos si por alguna razón la DB devuelve nulos
      if (item.producto) {
        mapaVentas.get(item.idVenta)!.detalles.push({
          producto: item.producto,
          cantidad: Number(item.cantidad) || 0,
          precioUnitario: Number(item.precioUnitario) || 0,
          subtotal: Number(item.subtotal) || 0
        });
      }
    });

    return Array.from(mapaVentas.values());
  }

  private calcularTotalGeneralVentas(): void {
    this.totalGeneralVentas = this.reporteVentasAgrupado.reduce((acc, venta) => acc + venta.totalNeto, 0);
  }

  // =================================================================
  // ================== UTILIDADES Y FILTROS =========================
  // =================================================================
  
 validarFechas(): void {
    // Si la fecha fin es mayor a HOY, la forzamos a HOY
    if (this.filtrosVentas.fechaFin > this.maxDate) {
      this.filtrosVentas.fechaFin = this.maxDate;
    }
    // Si la fecha inicio es mayor a la fecha fin, la retrocedemos
    if (this.filtrosVentas.fechaInicio > this.filtrosVentas.fechaFin) {
      this.filtrosVentas.fechaInicio = this.filtrosVentas.fechaFin;
    }
  }

private inicializarFiltrosDeVentas(): void {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    // Asignamos usando el formateador local
    this.filtrosVentas.fechaFin = this.formatearFechaLocal(hoy);
    this.filtrosVentas.fechaInicio = this.formatearFechaLocal(hace30Dias);
  }
  
  private cargarDatosParaFiltrosDeVentas(): void {
    this.cargarEstadosDeVenta();
    this.cargarFormasDePago();
    this.cargarTrabajadoresParaVentas();
  }

  private cargarEstadosDeVenta(): void {
    this.estadosVenta = [
      { value: 'COMPLETADA', viewValue: 'Completada' },
      { value: 'CANCELADA',  viewValue: 'Cancelada' },
    ];
  }

  private cargarFormasDePago(): void {
    // Si tienes un endpoint para formas de pago real, deberías llamarlo aquí.
    this.formasDePago = [
      { idFormaPago: 3333, nombre: 'Efectivo', estado: 'activo' } as forma_pago,
      { idFormaPago: 2222, nombre: 'Transferencia QR', estado: 'activo' } as forma_pago,
    ];
  }

  private cargarTrabajadoresParaVentas(): void {
    this.usuariosService.findTrabajadoresParaFiltro().subscribe({
      next: (res: ApiResponse) => {
        if(res.success && res.data) {
          this.trabajadoresVentas = res.data;
        }
      },
      error: (err) => {
        console.error('Error al cargar trabajadores', err);
        this.trabajadoresVentas = [];
      }
    });
  }
private formatearFechaLocal(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  private getTodayAsString(): string {
    return this.formatearFechaLocal(new Date());
  }

  // --- MÉTODOS PARA ESTADÍSTICAS HTML ---
  getVentasCompletadas(): number {
    return this.reporteVentasAgrupado.filter(venta => venta.estado === 'COMPLETADA').length;
  }

  getTotalProductosVendidos(): number {
    return this.reporteVentasAgrupado.reduce((total, venta) => {
      return total + venta.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
    }, 0);
  }

  exportarPDF(): void {
    // Recopilamos los totales que ya calcula tu componente
    const totales = {
      ingresos: this.totalGeneralVentas,
      completadas: this.getVentasCompletadas(),
      productos: this.getTotalProductosVendidos()
    };

    // Llamamos al servicio pasando los datos estructurados
    this.pdfGenerator.exportarReporteVentas(
      this.reporteVentasAgrupado,
      totales,
      this.filtrosVentas
    );
  }
}