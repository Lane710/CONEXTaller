import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { categorias } from '../../../../models/ProductoStockModel/categorias';
import { CategoriasService } from '../../../../services/ProductosServis/categorias.service';
import { ApiResponse } from '../../../../models/api-response';
import { Router } from '@angular/router';
import Modal from 'bootstrap/js/dist/modal';

@Component({
  selector: 'app-registrar-categoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-categoria.component.html',
  styleUrls: ['./registrar-categoria.component.css']
})
export class RegistrarCategoriaComponent implements OnInit {
  categoriaForm: FormGroup;
  imagenPrevia: string | ArrayBuffer | null = null;
  submitting = false;
  errorMessage = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder, 
    private CategoriaService: CategoriasService, 
    private router: Router
  ) {
    this.categoriaForm = this.fb.group({
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
      imagen: [null]
    });
  }

  ngOnInit(): void {}

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
  // Manejo de Envío del Formulario
  // =================================================================
  onSubmit(): void {
    this.categoriaForm.markAllAsTouched();

    // Validación de campos del formulario
    if (this.categoriaForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos correctamente.';
      this.scrollToError();
      return;
    }

    // Validación de imagen obligatoria
    if (!this.selectedFile) {
      this.errorMessage = 'La imagen de la categoría es obligatoria.';
      this.scrollToError();
      return;
    }

    // Validación de tipo de imagen
    if (!this.isValidImageType(this.selectedFile)) {
      this.errorMessage = 'Formato de imagen no válido. Use JPG, PNG o GIF.';
      this.scrollToError();
      return;
    }

    // Validación de tamaño de imagen
    if (!this.isValidImageSize(this.selectedFile)) {
      this.errorMessage = 'La imagen no puede ser mayor a 2MB.';
      this.scrollToError();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const nuevaCategoria: categorias = {
      idCategoria: 0,
      nombre: this.categoriaForm.value.nombre,
      descripcion: this.categoriaForm.value.descripcion,
      urlImagen: '',
      estado: true
    };

    this.CategoriaService.save(nuevaCategoria, this.selectedFile).subscribe({
      next: (res: ApiResponse) => {
        console.log('Categoría registrada:', res);
        this.submitting = false;
        this.categoriaForm.reset();
        this.imagenPrevia = null;
        this.selectedFile = null;

        // Mostrar modal de éxito
        this.showModal('modalExitoCategoria');
      },
      error: (err: any) => {
        console.error('Error al registrar la categoría:', err);
        this.submitting = false;
        
        // Manejo de diferentes tipos de errores
        if (err.status === 400) {
          this.errorMessage = err.error?.mensaje || 'Datos inválidos. Verifique la información ingresada.';
        } else if (err.status === 409) {
          this.errorMessage = 'Ya existe una categoría con ese nombre.';
        } else if (err.status === 413) {
          this.errorMessage = 'La imagen es demasiado grande. Use una imagen menor a 2MB.';
        } else if (err.status === 415) {
          this.errorMessage = 'Formato de imagen no soportado. Use JPG, PNG o GIF.';
        } else if (err.status === 500) {
          this.errorMessage = 'Error del servidor. Por favor, intente nuevamente más tarde.';
        } else if (err.status === 0) {
          this.errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else {
          this.errorMessage = err.error?.mensaje || 'Error desconocido al registrar la categoría.';
        }

        // Mostrar modal de error
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

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPrevia = reader.result;
      };
      reader.onerror = () => {
        this.errorMessage = 'Error al leer la imagen. Intente con otra imagen.';
        this.clearImage();
      };
      reader.readAsDataURL(file);
    } else {
      this.clearImage();
    }
  }

  clearImage(): void {
    this.imagenPrevia = null;
    this.selectedFile = null;
    this.categoriaForm.get('imagen')?.setValue(null);
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
    if (this.categoriaForm.dirty || this.selectedFile) {
      if (confirm('¿Está seguro de que desea cancelar? Se perderán los datos no guardados.')) {
        this.router.navigate(['/home/Categorias']);
      }
    } else {
      this.router.navigate(['/home/Categorias']);
    }
  }

  redireccionar(): void {
    this.router.navigate(['/home/Categorias']);
  }

  // =================================================================
  // Getters para Validación en Template
  // =================================================================
  get nombreInvalid() {
    const control = this.categoriaForm.get('nombre');
    return control?.invalid && (control?.dirty || control?.touched);
  }

  get descripcionInvalid() {
    const control = this.categoriaForm.get('descripcion');
    return control?.invalid && (control?.dirty || control?.touched);
  }

  get imagenInvalid() {
    const control = this.categoriaForm.get('imagen');
    return (this.categoriaForm.touched && !this.selectedFile) || 
           (this.selectedFile && (!this.isValidImageType(this.selectedFile) || !this.isValidImageSize(this.selectedFile)));
  }
}