import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { subcategoria } from '../../../models/ProductoStockModel/subcategorias';
import { SubcategoriaService } from '../../../services/ProductosServis/subcategoria-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse } from '../../../models/api-response';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

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

  // Filtros simplificados
  terminoBusqueda: string = '';
  filtroEstado: string = 'todos';
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
        this.aplicarFiltros(this.terminoBusqueda, this.filtroEstado);
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = 'Error al cargar las subcategorías';
        this.cargando = false;
      }
    });
  }

  // =================================================================
  // FILTROS SIMPLIFICADOS - Solo estado y búsqueda
  // =================================================================
  aplicarFiltros(termino: string = '', estado: string = 'todos'): void {
    this.terminoBusqueda = termino;
    this.filtroEstado = estado;
    
    this.subcategoriasFiltradas = this.subcategoriasExistentes.filter(subcategoria => {
      // Filtro por búsqueda en nombre y descripción
      const coincideBusqueda = !termino || 
        subcategoria.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        (subcategoria.descripcion && subcategoria.descripcion.toLowerCase().includes(termino.toLowerCase()));
      
      // Filtro por estado
      const coincideEstado = estado === 'todos' || 
        (estado === 'activo' && subcategoria.estado) ||
        (estado === 'inactivo' && !subcategoria.estado);
      
      return coincideBusqueda && coincideEstado;
    });
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

  // =================================================================
  // ELIMINACIÓN CON VALIDACIÓN
  // =================================================================
  eliminarSubcategoria(id: number | undefined): void {
    if (!id) return;

    this.subcategoriaService.canDeleteSubcategoria(id).subscribe({
      next: (response: any) => {
        console.log('Validación exitosa:', response);
        
        if (response.data && response.data.canDelete) {
          this.mostrarModalConfirmacionEliminacion(id);
        } else {
          const validationResult = response.data || response;
          this.mostrarModalConDependencias(validationResult, id);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al validar dependencias:', error);
        
        if (error.status === 409 && error.error && error.error.data) {
          const validationResult = error.error.data;
          this.mostrarModalConDependencias(validationResult, id);
        } else {
          const fallbackResult = {
            canDelete: false,
            message: 'Error al verificar dependencias. No se puede eliminar la subcategoría en este momento.',
            relatedProducts: 0
          };
          this.mostrarModalConDependencias(fallbackResult, id);
        }
      }
    });
  }

  private mostrarModalConfirmacionEliminacion(id: number): void {
    this.abrirBootstrapModal('modalEliminar');
    
    const btnConfirmar = document.getElementById('btnEliminarConfirmar');
    if (btnConfirmar) {
      const newBtn = btnConfirmar.cloneNode(true) as HTMLElement;
      btnConfirmar.parentNode?.replaceChild(newBtn, btnConfirmar);
      
      const handler = () => {
        this.subcategoriaService.deleteById(id).subscribe({
          next: () => {
            console.log(`Eliminación física exitosa: ID ${id}`);
            this.cargarSubcategorias();
            this.cerrarBootstrapModal('modalEliminar');
          },
          error: (error) => {
            console.error('Error al eliminar permanentemente:', error);
            alert('Error inesperado al eliminar la subcategoría.');
            this.cerrarBootstrapModal('modalEliminar');
          }
        });
      };
      
      newBtn.addEventListener('click', handler);
    }
  }

  private mostrarModalConDependencias(validation: any, id: number): void {
    console.log('Mostrando dependencias de subcategoría:', validation);
    
    const textoDependencias = document.getElementById('textoDependenciasSubcategoria');
    if (textoDependencias) {
      textoDependencias.innerHTML = this.buildDependenciesMessageSubcategoria(validation);
    }
    
    const modal = document.getElementById('modalDependenciasSubcategoria');
    if (modal) {
      modal.setAttribute('data-subcategoria-id', id.toString());
    }
    
    this.abrirBootstrapModal('modalDependenciasSubcategoria');
  }

  private buildDependenciesMessageSubcategoria(validation: any): string {
    const products = validation.relatedProducts || 0;
    const productsList = validation.relatedProductsList || [];
    
    let detailsHtml = '';
    let productsListHtml = '';
    
    if (products > 0) {
      detailsHtml += `
        <div class="dependency-item">
          <i class="fas fa-box me-2 text-danger"></i>
          <strong>Productos asociados:</strong> ${products} producto(s)
        </div>
      `;
      
      if (productsList.length > 0) {
        productsListHtml = `
          <div class="products-list mt-2">
            <h6 class="text-dark mb-2">Productos específicos:</h6>
            <div class="list-group" style="max-height: 200px; overflow-y: auto;">
              ${productsList.map((product: any) => `
                <div class="list-group-item list-group-item-action">
                  <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${product.nombre}</h6>
                    <small>ID: ${product.idProducto}</small>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    }
    
    return `
      <div class="dependencies-alert">
        <div class="alert alert-warning mb-3">
          <h6 class="alert-heading">
            <i class="fas fa-exclamation-triangle me-2"></i>
            No se puede eliminar la subcategoría
          </h6>
          <p class="mb-2">${validation.message || 'Existen productos asociados que impiden la eliminación.'}</p>
        </div>
        
        <div class="dependencies-details mb-3">
          <h6 class="text-dark mb-2">Dependencias encontradas:</h6>
          ${detailsHtml}
          ${productsListHtml}
        </div>
        
        <div class="suggestions">
          <h6 class="text-primary mb-2">💡 Acciones recomendadas:</h6>
          <ul class="list-unstyled small">
            ${products > 0 ? `
              <li class="mb-1">
                <i class="fas fa-arrow-right me-2 text-success"></i>
                <strong>Reasignar productos:</strong> Mover los ${products} producto(s) a otra subcategoría
              </li>
              <li class="mb-1">
                <i class="fas fa-trash-alt me-2 text-danger"></i>
                <strong>Eliminar productos:</strong> Eliminar permanentemente los productos asociados
              </li>
              <li class="mb-1">
                <i class="fas fa-edit me-2 text-info"></i>
                <strong>Editar productos:</strong> Cambiar la subcategoría de cada producto individualmente
              </li>
            ` : ''}
            <li class="mb-1">
              <i class="fas fa-toggle-off me-2 text-secondary"></i>
              <strong>Deshabilitar subcategoría:</strong> Cambiar el estado a inactivo en lugar de eliminar
            </li>
          </ul>
        </div>
      </div>
    `;
  }

  gestionarProductosSubcategoria(): void {
    const modal = document.getElementById('modalDependenciasSubcategoria');
    const subcategoriaId = modal?.getAttribute('data-subcategoria-id');
    
    if (subcategoriaId) {
      this.cerrarBootstrapModal('modalDependenciasSubcategoria');
      this.router.navigate(['/home/Productos'], { 
        queryParams: { subcategoria: subcategoriaId } 
      });
    }
  }

  // =================================================================
  // CAMBIO DE ESTADO
  // =================================================================
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

  // =================================================================
  // MODAL DETALLES Y ELIMINACIÓN
  // =================================================================
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
        this.eliminarSubcategoria(subcategoria.idSubcategoria);
        this.cerrarBootstrapModal('modalEliminar');
      });
    }

    this.abrirBootstrapModal('modalEliminar');
  }

  // =================================================================
  // UTILIDADES MODAL BOOTSTRAP
  // =================================================================
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