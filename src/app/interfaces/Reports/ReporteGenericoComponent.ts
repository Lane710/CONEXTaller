import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Este componente sirve como un marcador de posición simple para los reportes que aún no tienen su propia lógica.
@Component({
  selector: 'app-reporte-generico',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h4 class="mb-4">Reporte de {{ reportName }}</h4>
      <div class="alert alert-info" role="alert">
        El componente para el Reporte de <strong>{{ reportName }}</strong> aún está en construcción.
        Aquí se cargará la lógica y la interfaz específica de ese reporte.
      </div>
    </div>
  `,
})
export class ReporteGenericoComponent {
  // Recibe el nombre del reporte como input para mostrarlo
  @Input() reportName: string = 'Datos';
}