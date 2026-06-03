import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReporteVentasComponent } from '../reporte-ventas/reporte-ventas.component';
import { ReporteGenericoComponent } from '../ReporteGenericoComponent';
import { ReportePedidosComponent } from "../reporte-pedidos/reporte-pedidos.component";
import { ReporteProductosComponent } from "../reporte-productos/reporte-productos.component";
import { ReporteEnviosComponent } from "../reporte-envios/reporte-envios.component";
import { ReporteGananciasComponent } from '../reporte-ganancias/reporte-ganancias.component';


@Component({
  selector: 'app-report',
  standalone: true,
  // AÑADE ReporteGananciasComponent en los imports
  imports: [
    CommonModule, 
    ReporteVentasComponent, 
    ReportePedidosComponent, 
    ReporteProductosComponent, 
    ReporteEnviosComponent,
    ReporteGananciasComponent // ← AÑADE AQUÍ
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  currentReport: string = 'ganancias'; 

  reportTabs = [
    { id: 'ganancias', label: 'Ganancias', active: true },
    { id: 'ventas', label: 'Ventas', active: false },
    { id: 'pedidos', label: 'Pedidos', active: false },
    { id: 'productos', label: 'Productos', active: false },
    { id: 'envios', label: 'Envíos', active: false },
  ];

  constructor() {}

  ngOnInit(): void {
    this.currentReport = this.reportTabs.find(tab => tab.active)?.id || 'ganancias';
  }

  setActiveReport(reportId: string): void {
    this.currentReport = reportId;
    this.reportTabs.forEach(tab => tab.active = tab.id === reportId);
  }
}