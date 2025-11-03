import { Component, OnInit } from '@angular/core';
import { CategoriasService } from '../../../services/ProductosServis/categorias.service';
import { categorias } from '../../../models/ProductoStockModel/categorias';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-categorias',
  standalone: true,
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css'],
  imports: [CommonModule],
})
export class CategoriasComponent implements OnInit {

  categoriasExistentes: categorias[] = [];
  categoriaSeleccionada: categorias | null = null;
  mostrarModal: boolean = false;
  terminoBusqueda: string = '';
  filtroEstado: string = 'todos';
  categoriasFiltradas: categorias[] = [];

  constructor(private categoriasService: CategoriasService, private router: Router) { }

  ngOnInit(): void {
    console.log("Categorias cargadas");
    this.cargarCategorias();
  }

  redireccionarRegistro() {
    this.router.navigate(['home/Categorias/Registro']);
  }
    
  redireccionarEdicion(id: number | undefined): void {
    if (id) {
      this.router.navigate(['home/Categorias/Edicion', id]); 
      this.cerrarModal();
    }
  }

  redireccionarSubCategorias(categoriaId: number) {
    this.router.navigate(['home/Categorias/SubCategorias', categoriaId]);
  }

  // =================================================================
  // FILTROS SIMPLIFICADOS - Solo estado y búsqueda
  // =================================================================
  aplicarFiltros(termino: string = '', estado: string = 'todos'): void {
    this.terminoBusqueda = termino;
    this.filtroEstado = estado;
    
    this.categoriasFiltradas = this.categoriasExistentes.filter(categoria => {
      // Filtro por búsqueda en nombre y descripción
      const coincideBusqueda = !termino || 
        categoria.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        (categoria.descripcion && categoria.descripcion.toLowerCase().includes(termino.toLowerCase()));
      
      // Filtro por estado
      const coincideEstado = estado === 'todos' || 
        (estado === 'activo' && categoria.estado) ||
        (estado === 'inactivo' && !categoria.estado);
      
      return coincideBusqueda && coincideEstado;
    });
  }

  // =================================================================
  // CARGA DE CATEGORÍAS
  // =================================================================
  cargarCategorias(): void {
    this.categoriasService.findAll().subscribe(Respuesta => {
      this.categoriasExistentes = Respuesta.data;
      this.aplicarFiltros(this.terminoBusqueda, this.filtroEstado);
      console.log("Datos cargados:", Respuesta);
    });
  }

  // =================================================================
  // ELIMINACIÓN FÍSICA CON VALIDACIÓN
  // =================================================================
  eliminarCategoriaPermanente(id: number | undefined): void {
    if (!id) return;

    this.cerrarModal();

    this.categoriasService.canDeleteCategoria(id).subscribe({
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
            message: 'Error al verificar dependencias. No se puede eliminar la categoría en este momento.',
            relatedProducts: 0,
            relatedSubcategories: 0
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
        this.categoriasService.deleteById(id).subscribe({
          next: () => {
            console.log(`Eliminación física exitosa: ID ${id}`);
            this.cargarCategorias();
            this.cerrarBootstrapModal('modalEliminar');
          },
          error: (error) => {
            console.error('Error al eliminar permanentemente:', error);
            alert('Error inesperado al eliminar la categoría.');
            this.cerrarBootstrapModal('modalEliminar');
          }
        });
      };
      
      newBtn.addEventListener('click', handler);
    }
  }

  private mostrarModalConDependencias(validation: any, id: number): void {
    console.log('Mostrando dependencias:', validation);
    
    const textoDependencias = document.getElementById('textoDependencias');
    if (textoDependencias) {
      textoDependencias.innerHTML = this.buildDependenciesMessage(validation);
    }
    
    const modal = document.getElementById('modalDependencias');
    if (modal) {
      modal.setAttribute('data-categoria-id', id.toString());
    }
    
    this.abrirBootstrapModal('modalDependencias');
  }

  private buildDependenciesMessage(validation: any): string {
    const products = validation.relatedProducts || 0;
    const subcategories = validation.relatedSubcategories || 0;
    
    let detailsHtml = '';
    
    if (products > 0) {
      detailsHtml += `
        <div class="dependency-item">
          <i class="fas fa-box me-2 text-danger"></i>
          <strong>Productos asociados:</strong> ${products} producto(s)
        </div>
      `;
    }
    
    if (subcategories > 0) {
      detailsHtml += `
        <div class="dependency-item">
          <i class="fas fa-folder me-2 text-warning"></i>
          <strong>Subcategorías asociadas:</strong> ${subcategories} subcategoría(s)
        </div>
      `;
    }
    
    return `
      <div class="dependencies-alert">
        <div class="alert alert-warning mb-3">
          <h6 class="alert-heading">
            <i class="fas fa-exclamation-triangle me-2"></i>
            No se puede eliminar la categoría
          </h6>
          <p class="mb-2">${validation.message || 'Existen dependencias que impiden la eliminación.'}</p>
        </div>
        
        <div class="dependencies-details mb-3">
          <h6 class="text-dark mb-2">Dependencias encontradas:</h6>
          ${detailsHtml}
        </div>
        
        <div class="suggestions">
          <h6 class="text-primary mb-2">💡 Acciones recomendadas:</h6>
          <ul class="list-unstyled small">
            ${products > 0 ? `
              <li class="mb-1">
                <i class="fas fa-arrow-right me-2 text-success"></i>
                <strong>Reasignar productos:</strong> Mover los ${products} producto(s) a otra categoría
              </li>
              <li class="mb-1">
                <i class="fas fa-trash-alt me-2 text-danger"></i>
                <strong>Eliminar productos:</strong> Eliminar permanentemente los productos asociados
              </li>
            ` : ''}
            ${subcategories > 0 ? `
              <li class="mb-1">
                <i class="fas fa-folder-open me-2 text-info"></i>
                <strong>Gestionar subcategorías:</strong> Eliminar o mover las ${subcategories} subcategoría(s)
              </li>
            ` : ''}
            <li class="mb-1">
              <i class="fas fa-toggle-off me-2 text-secondary"></i>
              <strong>Deshabilitar categoría:</strong> Cambiar el estado a inactivo en lugar de eliminar
            </li>
          </ul>
        </div>
      </div>
    `;
  }

  gestionarProductosCategoria(): void {
    const modal = document.getElementById('modalDependencias');
    const categoriaId = modal?.getAttribute('data-categoria-id');
    
    if (categoriaId) {
      this.cerrarBootstrapModal('modalDependencias');
      this.router.navigate(['/home/Productos'], { 
        queryParams: { categoria: categoriaId } 
      });
    }
  }

  gestionarSubcategoriasCategoria(): void {
    const modal = document.getElementById('modalDependencias');
    const categoriaId = modal?.getAttribute('data-categoria-id');
    
    if (categoriaId) {
      this.cerrarBootstrapModal('modalDependencias');
      this.router.navigate(['/home/Categorias/SubCategorias', categoriaId]);
    }
  }

  // =================================================================
  // CAMBIO DE ESTADO
  // =================================================================
  EliminarOCambiarEstado(id: number | undefined, estadoActual: boolean): void {
    if (!id) return;

    const accion = estadoActual ? 'INACTIVAR' : 'ACTIVAR';
    this.cerrarModal();
    this.abrirBootstrapModal('modalConfirmacion');

    const texto = document.getElementById('textoConfirmacion');
    if (texto) texto.innerText = `¿Está seguro que desea ${accion} la categoría con ID ${id}?`;

    const btnConfirmar = document.getElementById('btnConfirmar');
    if (btnConfirmar) {
      const handler = () => {
        const numEstadoCambio = estadoActual ? 0 : 1;
        this.categoriasService.cambiarByIdEstado(id, numEstadoCambio).subscribe({
          next: () => {
            console.log(`Cambio de estado a ${!estadoActual} exitoso.`);
            this.cargarCategorias();
            this.cerrarBootstrapModal('modalConfirmacion');
            btnConfirmar.removeEventListener('click', handler);
          },
          error: (error) => {
            console.error(`Error al ${accion} la categoría:`, error);
            alert(`Error al ${accion} la categoría. Revise la conexión de la API.`);
            this.cerrarBootstrapModal('modalConfirmacion');
            btnConfirmar.removeEventListener('click', handler);
          }
        });
      };
      btnConfirmar.addEventListener('click', handler);
    }
  }
    
  // =================================================================
  // MODAL DETALLES
  // =================================================================
  abrirModalDetalles(categoria: categorias) {
    console.log('Abriendo modal para categoría:', categoria);
    this.categoriaSeleccionada = categoria;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.categoriaSeleccionada = null;
  }

  prevenirCierre(event: Event) {
    event.stopPropagation();
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
    if (backdrop) backdrop.remove();
  }
}