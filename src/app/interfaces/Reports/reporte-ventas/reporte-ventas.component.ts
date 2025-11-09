import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
// Asume que estas rutas son correctas en tu proyecto
import { forma_pago } from '../../../models/PedidosEnviosDetalles/forma_pago'; 
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { ApiResponse } from '../../../models/api-response';
import { ReportesService } from '../../../services/Reportes/reportes.service';
import { ReporteVenta } from '../../../DTOs/dtosBD/Report/ReporteVenta'; 


// --- INTERFACES PARA LA ESTRUCTURA AGRUPADA (Movidas aquí para independencia) ---
// Representa un solo producto dentro de una venta
interface DetalleVentaAgrupado {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Representa una venta completa con sus detalles anidados
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
  detalles: DetalleVentaAgrupado[]; // Array de productos
}

// Interfaces para los filtros
interface EstadoVenta {
  value: string;
  viewValue: string;
}


@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule], // Aseguramos los módulos necesarios
  templateUrl: './reporte-ventas.component.html',
  styleUrl: './reporte-ventas.component.css' // Usamos styleUrl para estilos separados
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

  // Los servicios deben ser inyectados aquí
  constructor(
    private usuariosService: UsuariosService, 
    private reportesService: ReportesService
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
    // Lógica ORIGINAL de la API RESTAURADA
    this.reportesService.findReporteVentas(
      this.filtrosVentas.fechaInicio,
      this.filtrosVentas.fechaFin,
      this.filtrosVentas.estado,
      this.filtrosVentas.formaPagoId,
      this.filtrosVentas.trabajadorUsername
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data) {
          // LLAMAMOS AL MÉTODO PARA AGRUPAR LOS DATOS
          this.reporteVentasAgrupado = this.agruparVentasPorId(res.data);
          this.calcularTotalGeneralVentas(); // Calculamos el total general
          console.log('Reporte de ventas AGRUPADO:', this.reporteVentasAgrupado);
        } else {
          this.reporteVentasAgrupado = [];
        }
        this.cargandoReporte = false;
      },
      error: (err) => {
        console.error('Error al generar el reporte de ventas:', err);
        this.cargandoReporte = false;
        // Opcional: Mostrar mensaje de error al usuario
      }
    });
  }

  /**
   * Transforma la lista plana de reportes en una lista agrupada por idVenta.
   */
  private agruparVentasPorId(reportePlano: ReporteVenta[]): VentaAgrupada[] {
    const mapaVentas = new Map<number, VentaAgrupada>();

    reportePlano.forEach(item => {
      // Si la venta no existe en el mapa, la creamos
      if (!mapaVentas.has(item.idVenta)) {
        mapaVentas.set(item.idVenta, {
          idVenta: item.idVenta,
          fechaVenta: item.fechaVenta,
          horaVenta: item.horaVenta,
          cliente: item.cliente,
          empleado: item.empleado,
          formaPago: item.formaPago,
          estado: item.estado,
          total: item.total,
          descuento: item.descuento,
          totalNeto: item.totalNeto,
          detalles: [] // Inicializamos el array de detalles vacío
        });
      }

      // Añadimos el detalle del producto a la venta correspondiente
      mapaVentas.get(item.idVenta)!.detalles.push({
        producto: item.producto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      });
    });

    // Convertimos el mapa a un array de sus valores
    return Array.from(mapaVentas.values());
  }

  /**
   * Calcula la suma de los 'totalNeto' de cada venta agrupada.
   */
  private calcularTotalGeneralVentas(): void {
    this.totalGeneralVentas = this.reporteVentasAgrupado.reduce((acc, venta) => acc + venta.totalNeto, 0);
  }

  // --- Métodos de utilidad y carga de filtros (manteniendo la lógica original) ---
  
  validarFechas(): void {
    if (this.filtrosVentas.fechaInicio > this.filtrosVentas.fechaFin) {
      this.filtrosVentas.fechaInicio = this.filtrosVentas.fechaFin;
    }
  }

  private inicializarFiltrosDeVentas(): void {
    const hoy = this.getTodayAsString();
    this.filtrosVentas.fechaInicio = hoy;
    this.filtrosVentas.fechaFin = hoy;
  }
  
  private cargarDatosParaFiltrosDeVentas(): void {
    this.cargarEstadosDeVenta();
    this.cargarFormasDePago();
    this.cargarTrabajadoresParaVentas();
  }

  private cargarEstadosDeVenta(): void {
    this.estadosVenta = [
      { value: 'COMPLETADA', viewValue: 'Completada' },
      { value: 'PENDIENTE',  viewValue: 'Pendiente' },
      { value: 'CANCELADA',  viewValue: 'Cancelada' },
      { value: 'DEVUELTA',   viewValue: 'Devuelta' }
    ];
  }

  private cargarFormasDePago(): void {
    // Simulación de data de pago (Mantener hasta que se conecte a la API)
    this.formasDePago = [
      { idFormaPago: 1111, nombre: 'Efectivo', estado: 'activo' } as forma_pago,
      { idFormaPago: 3333, nombre: 'Transferencia QR', estado: 'activo' } as forma_pago
    ];
    // Lógica real de API para formas de pago:
    // this.reportesService.findFormasDePago().subscribe({ ... }); 
  }

  private cargarTrabajadoresParaVentas(): void {
    // Lógica ORIGINAL de la API RESTAURADA (la que usa el servicio de usuarios)
    this.usuariosService.findTrabajadoresParaFiltro().subscribe({
      next: (res: ApiResponse) => {
        this.trabajadoresVentas = res.data;
      },
      error: (err) => {
        this.trabajadoresVentas = [];
      }
    });
  }

  private getTodayAsString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  // Métodos para las estadísticas
getVentasCompletadas(): number {
  return this.reporteVentasAgrupado.filter(venta => 
    venta.estado === 'COMPLETADA'
  ).length;
}

getTotalProductosVendidos(): number {
  return this.reporteVentasAgrupado.reduce((total, venta) => {
    return total + venta.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
  }, 0);
}

exportarPDF(): void {
  // Implementar lógica de exportación PDF
  alert('Funcionalidad de exportación PDF en desarrollo');
}

// Método para obtener el texto del estado
getTextoEstado(estado: string): string {
  const estados: { [key: string]: string } = {
    'COMPLETADA': 'Completada',
    'PENDIENTE': 'Pendiente', 
    'CANCELADA': 'Cancelada',
    'DEVUELTA': 'Devuelta'
  };
  return estados[estado] || estado;
}
}