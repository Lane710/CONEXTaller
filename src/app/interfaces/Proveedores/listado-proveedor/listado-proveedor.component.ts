import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiResponse } from '../../../models/api-response';
import { proveedores } from '../../../models/ProductoStockModel/proveedores';
import { ProveedoresService } from '../../../services/ProductosServis/proveedores-service.service';


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
  proveedoresFiltrados: proveedores[] = [];
  paginatedProveedores: proveedores[] = [];

  // Filtros y búsqueda
  searchTerm: string = '';
  filterStatus: string = 'todos';
  sortDirection: string = 'reciente';

  // Paginación
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  pages: number[] = [];

  // Proveedor seleccionado
  proveedorSeleccionado: proveedores | null = null;

  // Estados
  cargando: boolean = false;

  constructor(
    private proveedoresService: ProveedoresService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  /** Carga todos los proveedores desde el servicio */
  cargarProveedores(): void {
    this.cargando = true;
    this.proveedoresService.findAll().subscribe({
      next: (res: ApiResponse) => {
        this.proveedores = res.data || [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.cargando = false;
      }
    });
  }

  /** Aplica todos los filtros y ordenamientos */
  aplicarFiltros(): void {
    let filtered = [...this.proveedores];

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(proveedor =>
        proveedor.nombreEmpresa?.toLowerCase().includes(term) ||
        proveedor.nombreContacto?.toLowerCase().includes(term) ||
        proveedor.emailContacto?.toLowerCase().includes(term) ||
        proveedor.telefonoContacto?.includes(term)
      );
    }

    // Filtro por estado
    if (this.filterStatus !== 'todos') {
      const estado = this.filterStatus === 'activo';
      filtered = filtered.filter(proveedor => proveedor.estado === estado);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const dateA = new Date(a.fechaRegistro || '').getTime();
      const dateB = new Date(b.fechaRegistro || '').getTime();
      
      if (this.sortDirection === 'reciente') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    this.proveedoresFiltrados = filtered;
    this.totalPages = Math.ceil(this.proveedoresFiltrados.length / this.pageSize);
    this.actualizarPaginas();
    this.goToPage(1);
  }

  /** Actualiza la lista de páginas para la paginación */
  actualizarPaginas(): void {
    const pagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + pagesToShow - 1);

    if (endPage - startPage + 1 < pagesToShow) {
      startPage = Math.max(1, endPage - pagesToShow + 1);
    }

    this.pages = [];
    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  /** Navega a una página específica */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.proveedoresFiltrados.length);
    this.paginatedProveedores = this.proveedoresFiltrados.slice(startIndex, endIndex);
    this.actualizarPaginas();
  }
  /** Handlers para cambios en filtros */
  onSearchChange(): void {
    this.aplicarFiltros();
  }
  onStatusChange(): void {
    this.aplicarFiltros();
  }
  onSortChange(): void {
    this.aplicarFiltros();
  }
  /** Navegación */
  navigateToRegistrar(): void {
    this.router.navigate(['/home/registrarProveedores']);
  }
  /** Acciones sobre proveedores */
  verDetalles(proveedor: proveedores): void {
    this.proveedorSeleccionado = proveedor;
    // Abrir modal de detalles
    const modal = new (window as any).bootstrap.Modal(this.detallesProveedorModal.nativeElement);
    modal.show();
  }

  editarProveedor(proveedor: proveedores): void {
    this.router.navigate(['/home/proveedores/editar', proveedor.idProveedor]);
  }

  cambiarEstado(proveedor: proveedores): void {
    this.proveedorSeleccionado = proveedor;
    // Abrir modal de confirmación
    const modal = new (window as any).bootstrap.Modal(this.confirmarCambioEstadoModal.nativeElement);
    modal.show();
  }

  /** Confirma el cambio de estado del proveedor */
confirmarCambioEstado(): void {
  if (!this.proveedorSeleccionado) return;

  const nuevoEstado = !this.proveedorSeleccionado.estado;

  // Llamar al nuevo endpoint que solo cambia el estado
  this.proveedoresService.changeEstado(this.proveedorSeleccionado.idProveedor!, nuevoEstado).subscribe({
    next: (res: ApiResponse) => {
      if (res.success) {
        // Cerrar modal
        const modal = (window as any).bootstrap.Modal.getInstance(this.confirmarCambioEstadoModal.nativeElement);
        modal.hide();

        // Mostrar feedback visual (opcional)
        console.log(`Proveedor ${this.proveedorSeleccionado?.nombreEmpresa} actualizado correctamente.`);

        // Actualizar el estado localmente sin recargar toda la lista
        this.proveedorSeleccionado!.estado = nuevoEstado;
        const index = this.proveedores.findIndex(p => p.idProveedor === this.proveedorSeleccionado!.idProveedor);
        if (index !== -1) this.proveedores[index].estado = nuevoEstado;

        // Reaplicar filtros y refrescar la vista actual
        this.aplicarFiltros();
      } else {
        console.error('Error al cambiar estado del proveedor:', res.message);
      }
    },
    error: (err) => {
      console.error('Error al cambiar estado del proveedor:', err);
    }
  });
}

  
}