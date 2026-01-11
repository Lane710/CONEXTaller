import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Chart, registerables, ChartConfiguration, ChartOptions } from 'chart.js';
import { DatabaseService } from '../../../services/Dashboard/database.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';

// Interfaces
interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  marca: string;
  precio: number;
  costo: number;
  stock: number;
  imagen: string;
  estado: string;
  ventas_totales?: number;
  fecha_creacion?: string;
}

interface Pedido {
  id: number;
  total: number;
  fecha: string;
  estado: string;
  id_usuario: number;
  logistica?: { estado: string };
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  avatar: string;
  tipo: string;
  fecha_registro: string;
}

interface Venta {
  id: number;
  total_cobrado: number;
  fecha: string;
  estado_pago: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // =====================
  // DATOS CRUD
  // =====================
  rawPedidos: Pedido[] = [];
  rawVentas: Venta[] = [];
  rawProductos: Producto[] = [];
  rawUsuarios: Usuario[] = [];

  // =====================
  // KPIs
  // =====================
  kpiVentasTotal = { valor: 0, tendencia: 0, sube: true };
  kpiPedidosOnline = { valor: 0, tendencia: 0, sube: true };
  kpiTicketPromedio = { valor: 0, tendencia: 0, sube: true };
  kpiVentasTienda = { valor: 0, tendencia: 0, sube: true };
  kpiClientesNuevos = { valor: 0, tendencia: 0, sube: true };

  // =====================
  // Gráficos
  // =====================
  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' } } };
  barHorizData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  barHorizOptions: ChartOptions<'bar'> = { indexAxis: 'y', responsive: true, maintainAspectRatio: false };
  logisticsChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  categoryChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };
  userTypeChartData: ChartConfiguration<'polarArea'>['data'] = { labels: [], datasets: [] };

  // =====================
  // Variables auxiliares
  // =====================
  logisticsStats = { pendientes: 0, retrasados: 0, tiempoPromedio: 0 };
  topProductos: Producto[] = [];
  lowStockProductos: Producto[] = [];
  clientesRecientes: any[] = [];

  // =====================
  // CRUD Productos
  // =====================
  showProductForm = false;
  editingProduct: Producto | null = null;
  newProduct: Producto = { id: 0, nombre: '', categoria: '', marca: '', precio: 0, costo: 0, stock: 0, imagen: '', estado: 'Activo' };

  // =====================
  // Estado de carga
  // =====================
  isLoading = true;
  errorMessage = '';

  constructor(private databaseService: DatabaseService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  // =====================
  // Cargar datos desde backend
  // =====================
  cargarDatos(): void {
    this.isLoading = true;
    this.errorMessage = '';
    forkJoin({
      pedidos: this.databaseService.getPedidos(),
      ventas: this.databaseService.getVentas(),
      productos: this.databaseService.getProductos(),
      usuarios: this.databaseService.getUsuarios()
    }).subscribe({
      next: res => {
        this.rawPedidos = res.pedidos;
        this.rawVentas = res.ventas;
        this.rawProductos = res.productos;
        this.rawUsuarios = res.usuarios;

        this.calcularKPIs();
        this.generarGraficosPrincipales();
        this.generarGraficosSecundarios();
        this.procesarTablas();
        this.isLoading = false;
      },
      error: err => {
        console.error('Error al cargar datos:', err);
        this.errorMessage = 'Error al cargar los datos del dashboard';
        this.isLoading = false;
      }
    });
  }

  // =====================
  // KPIs
  // =====================
  calcularKPIs(): void {
    const totalPedidos = this.rawPedidos.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalVentasTienda = this.rawVentas.reduce((sum, v) => sum + (v.total_cobrado || 0), 0);

    this.kpiVentasTotal.valor = totalPedidos + totalVentasTienda;
    this.kpiPedidosOnline.valor = this.rawPedidos.length;
    this.kpiVentasTienda.valor = totalVentasTienda;

    const totalTransacciones = this.rawPedidos.length + this.rawVentas.length;
    this.kpiTicketPromedio.valor = totalTransacciones > 0 ? this.kpiVentasTotal.valor / totalTransacciones : 0;

    const fecha30Dias = new Date();
    fecha30Dias.setDate(fecha30Dias.getDate() - 30);
    this.kpiClientesNuevos.valor = this.rawUsuarios.filter(u => new Date(u.fecha_registro) > fecha30Dias).length;
  }

  // =====================
  // Gráficos principales
  // =====================
  generarGraficosPrincipales(): void {
    this.generarGraficoComparativaVentas();
    this.generarGraficoEstadosPedidos();
    this.generarGraficoLogistica();
  }

  generarGraficosSecundarios(): void {
    this.generarGraficoVentasCategoria();
    this.generarGraficoTiposUsuario();
  }

  generarGraficoComparativaVentas(): void {
    const ventasPorFecha: Record<string, { online: number, tienda: number }> = {};

    this.rawPedidos.forEach(p => {
      const fecha = new Date(p.fecha).toISOString().split('T')[0];
      if (!ventasPorFecha[fecha]) ventasPorFecha[fecha] = { online: 0, tienda: 0 };
      ventasPorFecha[fecha].online += p.total || 0;
    });

    this.rawVentas.forEach(v => {
      const fecha = new Date(v.fecha).toISOString().split('T')[0];
      if (!ventasPorFecha[fecha]) ventasPorFecha[fecha] = { online: 0, tienda: 0 };
      ventasPorFecha[fecha].tienda += v.total_cobrado || 0;
    });

    const fechas = Object.keys(ventasPorFecha).sort().slice(-15);
    this.lineChartData = {
      labels: fechas.map(f => new Date(f).toLocaleDateString()),
      datasets: [
        { label: 'Pedidos Online', data: fechas.map(f => ventasPorFecha[f].online), borderColor: '#4e73df', backgroundColor: 'rgba(78, 115, 223,0.1)', fill: true, tension: 0.4 },
        { label: 'Ventas Tienda', data: fechas.map(f => ventasPorFecha[f].tienda), borderColor: '#1cc88a', backgroundColor: 'rgba(28,200,138,0.1)', fill: true, tension: 0.4 }
      ]
    };
  }

  generarGraficoEstadosPedidos(): void {
    const estados: Record<string, number> = {};
    this.rawPedidos.forEach(p => estados[p.estado] = (estados[p.estado] || 0) + 1);
    this.barHorizData = { labels: Object.keys(estados), datasets: [{ label: 'Pedidos', data: Object.values(estados), backgroundColor: ['#f6c23e','#36b9cc','#4e73df','#1cc88a','#e74a3b'], borderRadius: 5 }] };
  }

  generarGraficoLogistica(): void {
    const logistica: Record<string, number> = { 'En tránsito': 0, 'Entregado': 0, 'Retrasado': 0, 'Cancelado': 0 };
    this.rawPedidos.forEach(p => { if(p.logistica?.estado) logistica[p.logistica.estado] = (logistica[p.logistica.estado] || 0)+1; });

    this.logisticsStats.pendientes = logistica['En tránsito'];
    this.logisticsStats.retrasados = logistica['Retrasado'];

    this.logisticsChartData = { labels: Object.keys(logistica).filter(k => logistica[k]>0), datasets:[{ data: Object.values(logistica).filter(v=>v>0), backgroundColor: ['#4e73df','#1cc88a','#e74a3b','#858796'] }]};
  }

  generarGraficoVentasCategoria(): void {
    const ventasCat: Record<string, number> = {};
    this.rawProductos.forEach(p => ventasCat[p.categoria] = (ventasCat[p.categoria]||0)+(p.ventas_totales||Math.floor(p.precio*0.1)));
    this.categoryChartData = { labels: Object.keys(ventasCat), datasets:[{ data:Object.values(ventasCat), backgroundColor:['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b','#858796'] }] };
  }

  generarGraficoTiposUsuario(): void {
    const tipos: Record<string, number> = {};
    this.rawUsuarios.forEach(u => tipos[u.tipo]=(tipos[u.tipo]||0)+1);
    this.userTypeChartData = { labels:Object.keys(tipos), datasets:[{ data:Object.values(tipos), backgroundColor:['rgba(78,115,223,0.7)','rgba(28,200,138,0.7)','rgba(246,194,62,0.7)','rgba(54,185,204,0.7)'] }] };
  }

  procesarTablas(): void {
    this.topProductos = [...this.rawProductos].sort((a,b)=> (b.ventas_totales||b.precio)-(a.ventas_totales||a.precio)).slice(0,5);
    this.lowStockProductos = this.rawProductos.filter(p=> (p.stock||0)<=10).sort((a,b)=> (a.stock||0)-(b.stock||0)).slice(0,5);
    this.clientesRecientes = this.rawPedidos.sort((a,b)=> new Date(b.fecha).getTime()-new Date(a.fecha).getTime()).slice(0,6).map(p=>{
      const u = this.rawUsuarios.find(u=>u.id===p.id_usuario) || { nombre:'Cliente', avatar:'https://randomuser.me/api/portraits/men/1.jpg', tipo:'Nuevo' };
      return { nombre:u.nombre, avatar:u.avatar, tipo:u.tipo, monto:p.total, estado:p.estado };
    });
  }

  // =====================
  // CRUD Productos
  // =====================
  agregarProducto(): void {
    if(!this.validarProducto()) return;
    const {id,...data} = this.newProduct;
    const operacion = this.editingProduct ? this.databaseService.updateProducto(this.editingProduct.id, data) : this.databaseService.addProducto(data);
    operacion.subscribe({
      next:()=> { this.cargarDatos(); this.cancelarEdicion(); alert(this.editingProduct?'Producto actualizado':'Producto agregado'); },
      error:(e)=> { console.error(e); alert('Error al guardar producto: '+(e.error?.error||e.message)); }
    });
  }

  editarProducto(producto: Producto): void { this.editingProduct = producto; this.newProduct = {...producto}; this.showProductForm = true; }
  eliminarProducto(id: number): void {
    if(confirm('¿Eliminar producto permanentemente?')) {
      this.databaseService.deleteProducto(id).subscribe({ next:()=>{this.cargarDatos(); alert('Producto eliminado');}, error:e=>{console.error(e); alert('Error: '+(e.error?.error||e.message));} });
    }
  }

  cancelarEdicion(): void {
    this.showProductForm=false;
    this.editingProduct=null;
    this.newProduct={ id:0, nombre:'', categoria:'', marca:'', precio:0, costo:0, stock:0, imagen:'', estado:'Activo' };
  }

  recargarDatos(): void { this.cargarDatos(); }

  private validarProducto(): boolean {
    if(!this.newProduct.nombre.trim()){ alert('Nombre requerido'); return false; }
    if(!this.newProduct.categoria.trim()){ alert('Categoría requerida'); return false; }
    if(this.newProduct.precio<=0){ alert('Precio mayor a 0'); return false; }
    if(this.newProduct.stock<0){ alert('Stock no puede ser negativo'); return false; }
    return true;
  }
  imgError(event: any) {
  event.target.src = 'https://via.placeholder.com/150?text=Imagen+No+Disponible';
}
}
