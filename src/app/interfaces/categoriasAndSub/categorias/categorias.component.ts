import { Component, OnInit } from '@angular/core';
import { CategoriasService } from '../../../services/ProductosServis/categorias.service';
import { categorias } from '../../../models/ProductoStockModel/categorias';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categorias',
  standalone: true,
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css'],
  imports: [CommonModule], // Solo necesitas CommonModule
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
    this.cargarCategorias(); // Llamada a la función de carga
  }

  
  redireccionarRegistro() {
    this.router.navigate(['home/Categorias/Registro']);
  }
    
    // Nueva función para Edición
    redireccionarEdicion(id: number | undefined): void {
        if (id) {
            this.router.navigate(['home/Categorias/Edicion', id]); 
            this.cerrarModal();
        }
    }

  redireccionarSubCategorias(categoriaId: number) {
    this.router.navigate(['home/Categorias/SubCategorias', categoriaId]);
  }
    // Eliminación física
eliminarCategoriaPermanente(id: number | undefined): void {
    if (!id) return;

    // Cierra modal de detalles antes de abrir confirmación
    this.cerrarModal();

    // Abrir modal de confirmación de eliminación
    this.abrirBootstrapModal('modalEliminar');

    // Asignar evento al botón de confirmación del modal
    const btnConfirmar = document.getElementById('btnEliminarConfirmar');
    if (btnConfirmar) {
        const handler = () => {
            this.categoriasService.deleteById(id).subscribe({
                next: () => {
                    console.log(`Eliminación física exitosa: ID ${id}`);
                    this.cargarCategorias();
                    this.cerrarBootstrapModal('modalEliminar');
                    btnConfirmar.removeEventListener('click', handler); // Limpieza del listener
                },
                error: (error) => {
                    console.error('Error al eliminar permanentemente:', error);
                    alert('Error al eliminar permanentemente. Revise dependencias de la DB.');
                    this.cerrarBootstrapModal('modalEliminar');
                    btnConfirmar.removeEventListener('click', handler);
                }
            });
        };
        btnConfirmar.addEventListener('click', handler);
    }
}

 
// Cambio de estado
EliminarOCambiarEstado(id: number | undefined, estadoActual: boolean): void {
    if (!id) return;

    const accion = estadoActual ? 'INACTIVAR' : 'ACTIVAR';

    // Cierra modal de detalles antes de abrir confirmación
    this.cerrarModal();

    // Abrir modal de confirmación
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
    
  // Abrir modal con los detalles de la categoría
  abrirModalDetalles(categoria: categorias) {
    console.log('Abriendo modal para categoría:', categoria); // Para debug
    this.categoriaSeleccionada = categoria;
    this.mostrarModal = true;
  }

  // Cerrar modal
  cerrarModal() {
    this.mostrarModal = false;
    this.categoriaSeleccionada = null;
  }

  // Prevenir que el clic en el modal lo cierre
  prevenirCierre(event: Event) {
    event.stopPropagation();
  }

  
// Método para aplicar filtros
aplicarFiltros(termino: string = '', estado: string = 'todos'): void {
  this.terminoBusqueda = termino;
  this.filtroEstado = estado;
  
  this.categoriasFiltradas = this.categoriasExistentes.filter(categoria => {
    // Filtro por término de búsqueda
    const coincideBusqueda = !termino || 
      categoria.nombre.toLowerCase().includes(termino.toLowerCase()) ||
      categoria.descripcion?.toLowerCase().includes(termino.toLowerCase());
    
    // Filtro por estado
    const coincideEstado = estado === 'todos' || 
      (estado === 'activo' && categoria.estado) ||
      (estado === 'inactivo' && !categoria.estado);
    
    return coincideBusqueda && coincideEstado;
  });
}

// Actualiza tu método cargarCategorias
cargarCategorias(): void {
  this.categoriasService.findAll().subscribe(Respuesta => {
    this.categoriasExistentes = Respuesta.data;
    this.categoriasFiltradas = [...this.categoriasExistentes]; // Inicializar filtradas
    console.log("Datos cargados:", Respuesta);
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
    if (backdrop) backdrop.remove();
  }
}

