import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../../services/Reportes/reportes.service';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { ApiResponse } from '../../../models/api-response';

// Asumimos que estos DTOs están importados correctamente
import { ReporteBajoStock } from '../../../DTOs/dtosBD/Report/ReporteBajoStock';
import { ReporteMasVendido } from '../../../DTOs/dtosBD/Report/ReporteMasVendido';
import { ReporteMaestroProducto } from '../../../DTOs/dtosBD/Report/ReporteMaestroProducto';
import { CategoriasService } from '../../../services/ProductosServis/categorias.service';


// =========================================================================
// ========================= 1. INTERFACES DE DATOS ========================
// =========================================================================

interface Categoria { id: number; nombre: string; }
interface UsuarioRegistro { username: string; email: string; }
interface EstadoProducto { value: number; viewValue: string; }


// =========================================================================
// =========================== 2. COMPONENT LOGIC ==========================
// =========================================================================

@Component({
  selector: 'app-reporte-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe], 
  templateUrl: './reporte-productos.component.html',
  styleUrl: './reporte-productos.component.css'
})
export class ReporteProductosComponent implements OnInit {

  // --- PROPIEDADES DE CONTROL DE VISTA ---
  currentProductReport: string = 'bajo_stock'; 

  productTabs = [
    { id: 'bajo_stock', label: 'Bajo Stock', active: true },
    { id: 'mas_vendidos', label: 'Más Vendidos', active: false },
    { id: 'maestro', label: 'Maestro de Productos', active: false },
  ];

  maxDate: string;
  cargandoReporte: boolean = false;
  // FALSO por defecto: hasta que se presione filtrar
  busquedaRealizada: boolean = false; 

  // --- DATOS GLOBALES PARA FILTROS ---
  categorias: Categoria[] = [];
  usuariosRegistro: UsuarioRegistro[] = [];
  estadosProducto: EstadoProducto[] = [];

  // ====================== 3. MODELOS DE FILTROS =======================
  
  filtrosBajoStock = {
    umbralStock: 10, 
    idCategoria: '' 
  };

  filtrosMasVendidos = {
    fechaInicio: '',
    fechaFin: '',
    idCategoria: '' 
  };

  filtrosMaestro = {
    estadoProducto: '', 
    idCategoria: '',
    usuarioRegistro: ''
  };

  // ===================== 4. MODELOS DE RESULTADOS ======================
  
  // Usando los DTOs importados
  reporteBajoStock: ReporteBajoStock[] = [];
  reporteMasVendidos: ReporteMasVendido[] = [];
  reporteMaestro: ReporteMaestroProducto[] = [];


  // =========================================================================
  // ========================== CONSTRUCTOR & INIT ===========================
  // =========================================================================

  constructor(
    private reportesService: ReportesService,
    private usuariosService: UsuariosService,
    private categoriasService: CategoriasService 
  ) {
    this.maxDate = this.getTodayAsString();
  }

  ngOnInit(): void {
    // Solo inicializar datos y cargar filtros, NO lanzar la consulta.
    this.inicializarFechas();
    this.cargarDatosGlobalesParaFiltros();
  }

  // =========================================================================
  // ==================== 5. MÉTODOS DE LA VISTA Y CONTROL ===================
  // =========================================================================

  setActiveProductReport(reportId: string): void {
    if (this.currentProductReport !== reportId) {
        this.currentProductReport = reportId;
        this.productTabs.forEach(tab => tab.active = tab.id === reportId);
        
        // Al cambiar de pestaña, limpiamos los resultados y el estado de búsqueda
        // para que se muestre el mensaje de "Defina los filtros".
        this.busquedaRealizada = false; 
        this.reporteBajoStock = [];
        this.reporteMasVendidos = [];
        this.reporteMaestro = [];
        this.cargandoReporte = false;
    }
  }

  // Este método solo se llama al presionar el botón "Filtrar"
  aplicarFiltros(reportId: string): void {
    this.cargandoReporte = true;
    this.busquedaRealizada = true; // Marcamos que se inició una búsqueda

    // Limpiamos los resultados del reporte actual antes de la consulta
    switch (reportId) {
        case 'bajo_stock': this.reporteBajoStock = []; break;
        case 'mas_vendidos': this.reporteMasVendidos = []; break;
        case 'maestro': this.reporteMaestro = []; break;
    }

    // Llama al método de consulta específico
    switch (reportId) {
      case 'bajo_stock':
        this.consultaReporteBajoStock();
        break;
      case 'mas_vendidos':
        this.consultaReporteMasVendidos();
        break;
      case 'maestro':
        this.consultaReporteMaestro();
        break;
      default:
        this.cargandoReporte = false;
    }
  }

  // =========================================================================
  // ==================== 6. MÉTODOS DE CONSULTA A LA API ====================
  // =========================================================================

  // A. Consulta BAJO STOCK
  private consultaReporteBajoStock(): void {
    const umbral: number = this.filtrosBajoStock.umbralStock || 0;
    const idCat: number | undefined = this.filtrosBajoStock.idCategoria ? 
                                       parseInt(this.filtrosBajoStock.idCategoria, 10) : undefined;
    
    this.reportesService.findReporteBajoStock(umbral, idCat).subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data) {
          this.reporteBajoStock = res.data as ReporteBajoStock[];
        }
        this.cargandoReporte = false;
      },
      error: (err) => {
        console.error('Error Bajo Stock:', err);
        this.cargandoReporte = false;
      }
    });
  }

  // B. Consulta MÁS VENDIDOS
  private consultaReporteMasVendidos(): void {
    this.validarFechas();
    const idCat: number | undefined = this.filtrosMasVendidos.idCategoria ? 
                                       parseInt(this.filtrosMasVendidos.idCategoria, 10) : undefined;
    
    this.reportesService.findReporteMasVendidos(
      this.filtrosMasVendidos.fechaInicio,
      this.filtrosMasVendidos.fechaFin,
      idCat
    ).subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data) {
          console.log(
            'nsoensoeifn',res
          )
          this.reporteMasVendidos = res.data as ReporteMasVendido[];
        }
        this.cargandoReporte = false;
      },
      error: (err) => {
        console.error('Error Más Vendidos:', err);
        this.cargandoReporte = false;
      }
    });
  }

  // C. Consulta MAESTRO DE PRODUCTOS
  private consultaReporteMaestro(): void {
    const estadoProd: number | undefined = this.filtrosMaestro.estadoProducto ? 
                                          parseInt(this.filtrosMaestro.estadoProducto, 10) : undefined;
    const idCat: number | undefined = this.filtrosMaestro.idCategoria ? 
                                       parseInt(this.filtrosMaestro.idCategoria, 10) : undefined;
    const usuario: string | undefined = this.filtrosMaestro.usuarioRegistro || undefined;
    
    this.reportesService.findReporteMaestroProductos(estadoProd, usuario, idCat).subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data) {
          this.reporteMaestro = res.data as ReporteMaestroProducto[];
        }
        this.cargandoReporte = false;
      },
      error: (err) => {
        console.error('Error Reporte Maestro:', err);
        this.cargandoReporte = false;
      }
    });
  }

  // =========================================================================
  // ==================== 7. MÉTODOS DE INICIALIZACIÓN Y UTILIDAD ============
  // =========================================================================

  cargarDatosGlobalesParaFiltros(): void {
    // 1. Cargar Estados de Producto
    this.estadosProducto = [
      { value: 1, viewValue: 'Activo' },
      { value: 0, viewValue: 'Inactivo' }
    ];
    
    // 2. Cargar Categorías usando el servicio de categorías
    this.categoriasService.findAll().subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data) {
          this.categorias = res.data.map((cat: any) => ({ id: cat.idCategoria, nombre: cat.nombre }));
        }
      },
      error: (err) => { console.error('Error cargando categorías:', err); }
    });
    
    // 3. Cargar Usuarios de Registro
    this.usuariosService.findTrabajadoresParaFiltro().subscribe({
        next: (res: ApiResponse) => { this.usuariosRegistro = res.data; },
        error: (err) => { console.error('Error cargando usuarios:', err); }
    });
  }
  
  inicializarFechas(): void {
    const hoy = this.getTodayAsString();
    this.filtrosMasVendidos.fechaFin = hoy;
    
    // Fecha de inicio por defecto (ej: hace 30 días)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    this.filtrosMasVendidos.fechaInicio = this.formatDate(thirtyDaysAgo);
  }

  validarFechas(): void {
    if (this.filtrosMasVendidos.fechaInicio > this.filtrosMasVendidos.fechaFin) {
      this.filtrosMasVendidos.fechaInicio = this.filtrosMasVendidos.fechaFin;
    }
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