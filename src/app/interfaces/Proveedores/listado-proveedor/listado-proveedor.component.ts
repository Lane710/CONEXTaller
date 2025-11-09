import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiResponse } from '../../../models/api-response';
import { proveedores } from '../../../models/ProductoStockModel/proveedores';
import { ProveedoresService } from '../../../services/ProductosServis/proveedores-service.service';

declare var bootstrap: any;

@Component({
  selector: 'app-listado-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-proveedor.component.html',
  styleUrls: ['./listado-proveedor.component.css']
})
export class ListadoProveedorComponent implements OnInit {
  @ViewChild('confirmarCambioEstadoModal') confirmarCambioEstadoModal!: ElementRef;
  @ViewChild('detallesProveedorModal') detallesProveedorModal!: ElementRef;

  // Listas
  proveedores: proveedores[] = [];
  filteredProveedores: proveedores[] = [];
  paginatedProveedores: proveedores[] = [];

  // Filtros y búsqueda
  searchTerm: string = '';
  filterStatus: string = 'todos';
  sortDirection: string = 'reciente';

  // Paginación
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;

  // Proveedor seleccionado
  proveedorSeleccionado: proveedores | null = null;

  // Estados
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private proveedoresService: ProveedoresService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  /** Carga todos los proveedores desde el servicio */
  cargarProveedores(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.proveedoresService.findAll().subscribe({
      next: (res: ApiResponse) => {
        this.proveedores = res.data || [];
        this.onFilterChange();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.errorMessage = 'Error al cargar los proveedores. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  /** Aplica todos los filtros y ordenamientos */
  onFilterChange(): void {
    let filtered = [...this.proveedores];

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(proveedor =>
        proveedor.nombreEmpresa?.toLowerCase().includes(term) ||
        proveedor.nombreContacto?.toLowerCase().includes(term) ||
        proveedor.emailContacto?.toLowerCase().includes(term) ||
        proveedor.telefonoContacto?.includes(term) ||
        proveedor.ciudad?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.filterStatus !== 'todos') {
      const estado = this.filterStatus === 'activo';
      filtered = filtered.filter(proveedor => proveedor.estado === estado);
    }

    // Ordenamiento por fecha
    filtered.sort((a, b) => {
      const dateA = new Date(a.fechaRegistro || '').getTime();
      const dateB = new Date(b.fechaRegistro || '').getTime();
      
      if (this.sortDirection === 'reciente') {
        return dateB - dateA; // Más reciente primero
      } else {
        return dateA - dateB; // Más antiguo primero
      }
    });

    this.filteredProveedores = filtered;
    this.totalPages = Math.ceil(this.filteredProveedores.length / this.pageSize);
    this.goToPage(1);
  }

  /** Handlers para cambios en filtros */
  onSearchChange(): void {
    this.onFilterChange();
  }

  onStatusChange(): void {
    this.onFilterChange();
  }

  onSortChange(): void {
    this.onFilterChange();
  }

  /** Navega a una página específica */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredProveedores.length);
    this.paginatedProveedores = this.filteredProveedores.slice(startIndex, endIndex);
  }

  /** Navegación */
  navigateToRegistrar(): void {
    this.router.navigate(['/home/registrarProveedores']);
  }

  /** Acciones sobre proveedores */
  verDetalles(proveedor: proveedores): void {
    this.proveedorSeleccionado = proveedor;
    this.abrirModal(this.detallesProveedorModal);
  }

  editarProveedor(proveedor: proveedores): void {
    this.router.navigate(['/home/proveedores/editar', proveedor.idProveedor]);
  }

  cambiarEstado(proveedor: proveedores): void {
    this.proveedorSeleccionado = proveedor;
    this.abrirModal(this.confirmarCambioEstadoModal);
  }

  /** Confirma el cambio de estado del proveedor */
  confirmarCambioEstado(): void {
    if (!this.proveedorSeleccionado) return;

    const nuevoEstado = !this.proveedorSeleccionado.estado;

    this.proveedoresService.changeEstado(this.proveedorSeleccionado.idProveedor!, nuevoEstado).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          // Cerrar modal
          this.cerrarModal(this.confirmarCambioEstadoModal);

          // Actualizar el estado localmente
          this.proveedorSeleccionado!.estado = nuevoEstado;
          const index = this.proveedores.findIndex(p => p.idProveedor === this.proveedorSeleccionado!.idProveedor);
          if (index !== -1) {
            this.proveedores[index].estado = nuevoEstado;
          }

          // Reaplicar filtros para actualizar la vista
          this.onFilterChange();

          // Mostrar mensaje de éxito (opcional - puedes implementar un toast o alert)
          console.log(`Proveedor ${this.proveedorSeleccionado?.nombreEmpresa} ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
        } else {
          console.error('Error al cambiar estado del proveedor:', res.message);
          this.errorMessage = 'Error al cambiar el estado del proveedor.';
        }
      },
      error: (err) => {
        console.error('Error al cambiar estado del proveedor:', err);
        this.errorMessage = 'Error de conexión al cambiar el estado del proveedor.';
      }
    });
  }

  /** Métodos auxiliares para manejar modales */
  private abrirModal(modalElement: ElementRef): void {
    if (modalElement && modalElement.nativeElement) {
      const modal = new bootstrap.Modal(modalElement.nativeElement);
      modal.show();
    }
  }

  private cerrarModal(modalElement: ElementRef): void {
    if (modalElement && modalElement.nativeElement) {
      const modal = bootstrap.Modal.getInstance(modalElement.nativeElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  /** Métodos para calcular propiedades computadas */
  get totalProveedores(): number {
    return this.filteredProveedores.length;
  }

  get proveedoresActivos(): number {
    return this.filteredProveedores.filter(p => p.estado).length;
  }

  get proveedoresInactivos(): number {
    return this.filteredProveedores.filter(p => !p.estado).length;
  }

  /** Método para formatear fechas (opcional) */
  formatearFecha(fecha: string | Date): string {
    if (!fecha) return 'No disponible';
    
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /** Método para limpiar filtros */
  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filterStatus = 'todos';
    this.sortDirection = 'reciente';
    this.onFilterChange();
  }

  /** Método para recargar datos */
  recargarDatos(): void {
    this.cargarProveedores();
  }
}