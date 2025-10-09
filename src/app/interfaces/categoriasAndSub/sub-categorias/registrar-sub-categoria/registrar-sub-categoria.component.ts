import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubcategoriaService } from '../../../../services/ProductosServis/subcategoria-service.service';
import { ApiResponse } from '../../../../models/api-response';
import { CategoriasService } from '../../../../services/ProductosServis/categorias.service';
import { categorias } from '../../../../models/ProductoStockModel/categorias';

// ✅ Importar Bootstrap correctamente
import Modal from 'bootstrap/js/dist/modal';

@Component({
  selector: 'app-registrar-subcategoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-sub-categoria.component.html',
  styleUrls: ['./registrar-sub-categoria.component.css'] // 🔧 corregido (antes estaba "styleUrl")
})
export class RegistrarSubcategoriaComponent implements OnInit {
  subcategoriaForm: FormGroup;
  imagenPrevia: string | ArrayBuffer | null = null;
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
      imagen: [null]
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
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const subcategoriaNueva = {
      nombre: this.subcategoriaForm.value.nombre,
      descripcion: this.subcategoriaForm.value.descripcion,
      categoria: this.categoriaActual,
      urlImagen: '',
      estado: true
    };

    this.SubcategoriaService.save(subcategoriaNueva, this.selectedFile).subscribe({
      next: (response: ApiResponse) => {
        console.log('Subcategoría registrada con éxito:', response);
        this.submitting = false;
        this.subcategoriaForm.reset();
        this.imagenPrevia = null;
        this.selectedFile = null;

        // ✅ Mostrar el modal de éxito
        const modalElement = document.getElementById('modalExito');
        if (modalElement) {
          const modalExito = new Modal(modalElement);
          modalExito.show();
        } else {
          console.error('No se encontró el modal de éxito');
        }
      },
      error: (error: any) => {
        console.error('Error al registrar la subcategoría:', error);
        this.submitting = false;
        this.errorMessage = error.error?.mensaje || 'Error desconocido al registrar la subcategoría.';

        // ⚠️ Mostrar el modal de error
        const modalElement = document.getElementById('modalError');
        if (modalElement) {
          const modalError = new Modal(modalElement);
          modalError.show();
        } else {
          console.error('No se encontró el modal de error');
        }
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        this.errorMessage = 'Formato de imagen no válido. Use JPG, PNG o GIF.';
        this.clearImage();
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'La imagen no puede ser mayor a 2MB.';
        this.clearImage();
        return;
      }

      this.errorMessage = '';
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPrevia = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.clearImage();
    }
  }

  clearImage(): void {
    this.imagenPrevia = null;
    this.selectedFile = null;
    this.subcategoriaForm.get('imagen')?.setValue(null);
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onCancel(): void {
    this.router.navigate(['home/Categorias/SubCategorias', this.categoriaId]);
  }

  get nombreInvalid() {
    const control = this.subcategoriaForm.get('nombre');
    return control?.invalid && (control?.dirty || control?.touched);
  }

  get descripcionInvalid() {
    const control = this.subcategoriaForm.get('descripcion');
    return control?.invalid && (control?.dirty || control?.touched);
  }

  redireccionar(): void {
    this.router.navigate(['home/Categorias/SubCategorias', this.categoriaId]);
  }
}
