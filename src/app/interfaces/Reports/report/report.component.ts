import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReporteVentasComponent } from '../reporte-ventas/reporte-ventas.component';
import { ReporteGenericoComponent } from '../ReporteGenericoComponent';
import { ReportePedidosComponent } from "../reporte-pedidos/reporte-pedidos.component";
import { ReporteProductosComponent } from "../reporte-productos/reporte-productos.component";
import { ReporteEnviosComponent } from "../reporte-envios/reporte-envios.component";

@Component({
  selector: 'app-report',
  standalone: true,
  // Importamos CommonModule para ngSwitch y los componentes hijos
  imports: [CommonModule, ReporteVentasComponent, ReporteGenericoComponent, ReportePedidosComponent, ReporteProductosComponent, ReporteEnviosComponent],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  // Controla qué componente hijo debe renderizarse
  currentReport: string = 'ganancias'; 

  // Definición de las pestañas/opciones disponibles
  reportTabs = [
    { id: 'ganancias', label: 'Ganancias', active: true },
    { id: 'ventas', label: 'Ventas', active: false },
    { id: 'pedidos', label: 'Pedidos', active: false },
    { id: 'productos', label: 'Productos', active: false },
    { id: 'envios', label: 'Envíos', active: false },
    { id: 'facturas', label: 'Facturas', active: false },
  ];

  constructor() {}

  ngOnInit(): void {
    this.currentReport = this.reportTabs.find(tab => tab.active)?.id || 'ganancias';
  }

  // Método para cambiar el reporte activo cuando se hace clic en una pestaña
  setActiveReport(reportId: string): void {
    this.currentReport = reportId;
    this.reportTabs.forEach(tab => tab.active = tab.id === reportId);
  }
}