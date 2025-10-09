import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { subcategoria } from '../../../models/ProductoStockModel/subcategorias';
import { SubcategoriaService } from '../../../services/ProductosServis/subcategoria-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse } from '../../../models/api-response';
import { FormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-sub-categorias',
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './sub-categorias.component.html',
  styleUrl: './sub-categorias.component.css'
})
export class SubcategoriasComponent implements OnInit {

  subcategoriasExistentes: subcategoria[] = [];
  subcategoriaSeleccionada: subcategoria | null = null;
  mostrarModal: boolean = false;
  categoriaId: number | null = null;
  categoriaInfo: any = null;

  // Filtros
  terminoBusqueda: string = '';
  filtroEstado: 'todos' | 'activo' | 'inactivo' = 'todos';
  subcategoriasFiltradas: subcategoria[] = [];

  cargando: boolean = true;
  errorCarga: string | null = null;

  constructor(
    private subcategoriaService: SubcategoriaService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.obtenerIdCategoria();
  }

  private obtenerIdCategoria(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('categoriaId');
      if (id) {
        this.categoriaId = +id;
        this.cargarSubcategorias();
      } else {
        this.errorCarga = 'No se especificó la categoría';
        this.router.navigate(['home/Categorias']);
      }
    });
  }

  cargarSubcategorias(): void {
    if (!this.categoriaId) {
      this.errorCarga = 'ID de categoría no válido';
      return;
    }
    this.cargando = true;
    this.subcategoriaService.ListadoSubCategoriasPorCategoria(this.categoriaId).subscribe({
      next: (respuesta: ApiResponse) => {
        this.subcategoriasExistentes = respuesta.data as subcategoria[] || [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = 'Error al cargar las subcategorías';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    let filtradas = this.subcategoriasExistentes;

    if (this.filtroEstado === 'activo') {
      filtradas = filtradas.filter(s => s.estado === true);
    } else if (this.filtroEstado === 'inactivo') {
      filtradas = filtradas.filter(s => s.estado === false);
    }

    if (this.terminoBusqueda.trim()) {
      const busqueda = this.terminoBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter(s =>
        s.nombre.toLowerCase().includes(busqueda) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(busqueda))
      );
    }

    this.subcategoriasFiltradas = filtradas;
  }

  redireccionarRegistro(): void {
    if (this.categoriaId) {
      this.router.navigate(['home/Categorias/SubCategorias/Registro', this.categoriaId]);
    } else {
      this.router.navigate(['home/Categorias']);
    }
  }

  regresarACategorias(): void {
    this.router.navigate(['home/Categorias']);
  }

  eliminarSubcategoria(id: number | undefined): void {
    if (!id || !confirm(`¿Está seguro que desea eliminar permanentemente la subcategoría con ID ${id}?`)) {
      return;
    }

    this.subcategoriaService.deleteById(id).subscribe({
      next: () => {
        console.log('Subcategoría eliminada:', id);
        this.cerrarModal();
        this.cargarSubcategorias();
      },
      error: () => {
        alert('Error al eliminar la subcategoría. Intente nuevamente.');
      }
    });
  }

  EliminarOCambiarEstado(id: number | undefined, estadoActual: boolean): void {
    if (!id) return;
    const accion = estadoActual ? 'INACTIVAR' : 'ACTIVAR';
    if (!confirm(`¿Está seguro que desea ${accion} la subcategoría con ID ${id}?`)) return;

    const nuevoEstado = estadoActual ? 0 : 1;
    this.subcategoriaService.cambiarEstado(id, nuevoEstado).subscribe({
      next: () => {
        this.cargarSubcategorias();
      },
      error: () => {
        alert(`Error al ${accion} la subcategoría.`);
      }
    });
  }

  abrirModalDetalles(subcategoria: subcategoria): void {
    this.subcategoriaSeleccionada = subcategoria;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.subcategoriaSeleccionada = null;
  }

  prevenirCierre(event: Event): void {
    event.stopPropagation();
  }

  abrirModalCambioEstado(subcategoria: subcategoria): void {
    if (!subcategoria) return;
    this.subcategoriaSeleccionada = subcategoria;

    const modalElement = document.getElementById('modalConfirmacion');
    if (!modalElement) return;

    const texto = `¿Está seguro que desea ${subcategoria.estado ? 'INACTIVAR' : 'ACTIVAR'} la subcategoría "${subcategoria.nombre}"?`;
    const parrafo = modalElement.querySelector('#textoConfirmacion');
    if (parrafo) parrafo.textContent = texto;

    const btnConfirmar = modalElement.querySelector('#btnConfirmar') as HTMLButtonElement;
    if (btnConfirmar) {
      const nuevoBtn = btnConfirmar.cloneNode(true) as HTMLButtonElement;
      btnConfirmar.parentNode?.replaceChild(nuevoBtn, btnConfirmar);

      nuevoBtn.addEventListener('click', () => {
        this.cambiarEstadoSubcategoria(subcategoria);
        this.cerrarBootstrapModal('modalConfirmacion');
      });
    }

    this.abrirBootstrapModal('modalConfirmacion');
  }

   cambiarEstadoSubcategoria(subcategoria: subcategoria): void {
    const nuevoEstado = subcategoria.estado ? 0 : 1;
    this.subcategoriaService.cambiarEstado(subcategoria.idSubcategoria!, nuevoEstado).subscribe({
      next: () => this.cargarSubcategorias(),
      error: () => alert('Error al cambiar el estado.')
    });
  }

  abrirModalEliminar(subcategoria: subcategoria): void {
    if (!subcategoria) return;
    this.subcategoriaSeleccionada = subcategoria;

    const modalElement = document.getElementById('modalEliminar');
    if (!modalElement) return;

    const texto = `¿Está seguro que desea eliminar PERMANENTEMENTE la subcategoría "${subcategoria.nombre}"?`;
    const parrafo = modalElement.querySelector('#textoEliminar');
    if (parrafo) parrafo.textContent = texto;

    const btnConfirmar = modalElement.querySelector('#btnEliminarConfirmar') as HTMLButtonElement;
    if (btnConfirmar) {
      const nuevoBtn = btnConfirmar.cloneNode(true) as HTMLButtonElement;
      btnConfirmar.parentNode?.replaceChild(nuevoBtn, btnConfirmar);

      nuevoBtn.addEventListener('click', () => {
        this.eliminarSubcategoriaConfirmada(subcategoria);
        this.cerrarBootstrapModal('modalEliminar');
      });
    }

    this.abrirBootstrapModal('modalEliminar');
  }

   eliminarSubcategoriaConfirmada(subcategoria: subcategoria): void {
    if (!subcategoria.idSubcategoria) return;
    this.subcategoriaService.deleteById(subcategoria.idSubcategoria).subscribe({
      next: () => {
        this.cargarSubcategorias();
        this.subcategoriaSeleccionada = null;
      },
      error: () => alert('No se pudo eliminar la subcategoría.')
    });
  }

  // ===============================================
  // NUEVAS FUNCIONES PARA ABRIR / CERRAR MODALES SIN BUGS
  // ===============================================

   abrirBootstrapModal(idModal: string): void {
    const modalEl = document.getElementById(idModal);
    if (!modalEl) return;
    modalEl.classList.add('show');
    modalEl.style.display = 'block';
    document.body.classList.add('modal-open');
    const backdrop = document.createElement('div');
    backdrop.classList.add('modal-backdrop', 'fade', 'show');
    backdrop.id = `backdrop-${idModal}`;
    document.body.appendChild(backdrop);
  }

   cerrarBootstrapModal(idModal: string): void {
    const modalEl = document.getElementById(idModal);
    if (!modalEl) return;
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById(`backdrop-${idModal}`);
    this.mostrarModal = false;
    this.subcategoriaSeleccionada = null;
    if (backdrop) backdrop.remove();
  }
}
