import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubcategoriaService } from '../../../../services/ProductosServis/subcategoria-service.service';
import { ApiResponse } from '../../../../models/api-response';
import { CategoriasService } from '../../../../services/ProductosServis/categorias.service';
import { categorias } from '../../../../models/ProductoStockModel/categorias';
import Modal from 'bootstrap/js/dist/modal';

@Component({
  selector: 'app-registrar-subcategoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-sub-categoria.component.html',
  styleUrls: ['./registrar-sub-categoria.component.css']
})
export class RegistrarSubcategoriaComponent implements OnInit {
  subcategoriaForm: FormGroup;
  submitting = false;
  errorMessage = '';
  selectedFile: File | null = null;
  categoriaId!: number;
  
  categoriaActual: categorias = {
    idCategoria: 0,
    nombre: '',
    descripcion: '',
    urlImagen: '',
    estado: true
  };

  constructor(
    private fb: FormBuilder,
    private SubcategoriaService: SubcategoriaService,
    private route: ActivatedRoute,
    private categoriaService: CategoriasService,
    private router: Router
  ) {
    this.subcategoriaForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      descripcion: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      imagen: [null] // No es requerido
    });
  }

  ngOnInit(): void {
    this.categoriaId = Number(this.route.snapshot.paramMap.get('categoriaId'));
    this.obtenerCategoriaId();
  }

  obtenerCategoriaId(): void {
    this.categoriaService.findById(this.categoriaId).subscribe({
      next: (response: ApiResponse) => {
        this.categoriaActual = response.data;
      },
      error: (error: any) => {
        console.error('Error al obtener la categoría:', error);
        this.errorMessage = error.error?.mensaje || 'Error desconocido al obtener la categoría.';
      }
    });
  }

  onSubmit(): void {
    this.subcategoriaForm.markAllAsTouched();

    if (this.subcategoriaForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      this.scrollToError();
      return;
    }

    // Validar imagen si se seleccionó una
    if (this.selectedFile && !this.isValidImageType(this.selectedFile)) {
      this.errorMessage = 'Formato de imagen no válido. Use JPG, PNG o GIF.';
      this.scrollToError();
      return;
    }

    if (this.selectedFile && !this.isValidImageSize(this.selectedFile)) {
      this.errorMessage = 'La imagen no puede ser mayor a 2MB.';
      this.scrollToError();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const subcategoriaNueva = {
      nombre: this.subcategoriaForm.value.nombre,
      descripcion: this.subcategoriaForm.value.descripcion,
      categoria: this.categoriaActual,
      urlImagen: '', // Se asignará desde el servicio
      estado: true
    };

    // Si no hay archivo seleccionado, se enviará null y el backend usará la imagen por defecto
    this.SubcategoriaService.save(subcategoriaNueva, this.selectedFile).subscribe({
      next: (response: ApiResponse) => {
        console.log('Subcategoría registrada con éxito:', response);
        this.submitting = false;
        this.subcategoriaForm.reset();
        this.selectedFile = null;

        // Mostrar modal de éxito
        this.showModal('modalExito');
      },
      error: (error: any) => {
        console.error('Error al registrar la subcategoría:', error);
        this.submitting = false;
        
        // Manejo mejorado de errores
        if (error.status === 400) {
          this.errorMessage = error.error?.mensaje || 'Datos inválidos. Verifique la información ingresada.';
        } else if (error.status === 409) {
          this.errorMessage = 'Ya existe una subcategoría con ese nombre en esta categoría.';
        } else if (error.status === 413) {
          this.errorMessage = 'La imagen es demasiado grande. Use una imagen menor a 2MB.';
        } else if (error.status === 415) {
          this.errorMessage = 'Formato de imagen no soportado. Use JPG, PNG o GIF.';
        } else if (error.status === 500) {
          this.errorMessage = 'Error del servidor. Por favor, intente nuevamente más tarde.';
        } else if (error.status === 0) {
          this.errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else {
          this.errorMessage = error.error?.mensaje || 'Error desconocido al registrar la subcategoría.';
        }

        this.showModal('modalError');
      }
    });
  }

  // =================================================================
  // Manejo de Archivos de Imagen
  // =================================================================
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      // Validar tipo de archivo
      if (!this.isValidImageType(file)) {
        this.errorMessage = 'Formato de imagen no válido. Use JPG, PNG o GIF.';
        this.clearImage();
        return;
      }

      // Validar tamaño
      if (!this.isValidImageSize(file)) {
        this.errorMessage = 'La imagen no puede ser mayor a 2MB.';
        this.clearImage();
        return;
      }

      this.errorMessage = '';
      this.selectedFile = file;
    } else {
      this.clearImage();
    }
  }

  clearImage(): void {
    this.selectedFile = null;
    this.subcategoriaForm.get('imagen')?.setValue(null);
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // =================================================================
  // Validaciones de Imagen
  // =================================================================
  isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  }

  isValidImageSize(file: File): boolean {
    return file.size <= 2 * 1024 * 1024; // 2MB máximo
  }

  // =================================================================
  // Utilidades
  // =================================================================
  scrollToError(): void {
    const firstErrorElement = document.querySelector('.is-invalid');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  showModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    } else {
      console.error(`No se encontró el modal con ID: ${modalId}`);
    }
  }

  onCancel(): void {
    if (this.subcategoriaForm.dirty || this.selectedFile) {
      if (confirm('¿Está seguro de que desea cancelar? Se perderán los datos no guardados.')) {
        this.router.navigate(['/home/Categorias/SubCategorias', this.categoriaId]);
      }
    } else {
      this.router.navigate(['/home/Categorias/SubCategorias', this.categoriaId]);
    }
  }

  redireccionar(): void {
    this.router.navigate(['/home/Categorias/SubCategorias', this.categoriaId]);
  }

  // =================================================================
  // Getters para Validación en Template
  // =================================================================
  get nombreInvalid() {
    const control = this.subcategoriaForm.get('nombre');
    return control?.invalid && (control?.dirty || control?.touched);
  }

  get descripcionInvalid() {
    const control = this.subcategoriaForm.get('descripcion');
    return control?.invalid && (control?.dirty || control?.touched);
  }

  get imagenInvalid() {
    return this.selectedFile && 
           (!this.isValidImageType(this.selectedFile) || !this.isValidImageSize(this.selectedFile));
  }
}