import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { categorias } from '../../../../models/ProductoStockModel/categorias';
import { CategoriasService } from '../../../../services/ProductosServis/categorias.service';
import { ApiResponse } from '../../../../models/api-response';
import { Router } from '@angular/router';
import Modal from 'bootstrap/js/dist/modal'; // ✅ Importa Bootstrap modal
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

  // Variable para almacenar el archivo seleccionado (tipo File), no la ruta o el control
  selectedFile: File | null = null; 

  constructor(
    private fb: FormBuilder, 
    private CategoriaService: CategoriasService, 
    private router:Router
  ) {
    // Nota importante: Eliminamos Validators.required del campo 'imagen' del Form, 
    // ya que este campo ahora solo guardará el objeto File temporalmente, no el valor de la URL.
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
      // El campo 'imagen' ya no necesita Validators.required aquí, el archivo se valida en onFileSelected
      imagen: [null] 
    });
  }

  ngOnInit(): void {}

  // =================================================================
  // Lógica de Envío Corregida para FormData
  // =================================================================
  

  
onSubmit(): void {
  this.categoriaForm.markAllAsTouched();

  if (this.categoriaForm.invalid) {
    this.errorMessage = 'Por favor, complete todos los campos correctamente.';
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
    next: (res:ApiResponse) => {
      console.log('Categoría registrada:', res);
      this.submitting = false;
      this.categoriaForm.reset();
      this.imagenPrevia = null;
      this.selectedFile = null;

      // ✅ Mostrar el modal de éxito
      const modalElement = document.getElementById('modalExitoCategoria');
      if (modalElement) {
        const modalExito = new Modal(modalElement);
        modalExito.show();
      } else {
        console.error('No se encontró el modal de éxito de categoría');
      }
    },
    error: (err: { error: { mensaje: string; }; }) => {
      console.error('Error al registrar la categoría:', err);
      this.submitting = false;
      this.errorMessage = err.error?.mensaje || 'Error desconocido';

      // ⚠️ Opcional: puedes mostrar un modal de error como en subcategoría
      const modalElement = document.getElementById('modalError');
      if (modalElement) {
        const modalError = new Modal(modalElement);
        modalError.show();
      }
    }
  });
}


  // =================================================================
  // Lógica de Selección y Previsualización de Archivos
  // =================================================================
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (file) {
      // 1. Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        this.errorMessage = 'Formato de imagen no válido. Use JPG, PNG o GIF.';
        this.clearImage();
        return;
      }

      // 2. Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'La imagen no puede ser mayor a 2MB.';
        this.clearImage();
        return;
      }

      this.errorMessage = '';
      
      // ALMACENAR el archivo en la variable del componente, NO en el Form (solo para referencia)
      this.selectedFile = file; 

      // Crear vista previa
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
    // Resetea el control del formulario para limpiar el input file
    this.categoriaForm.get('imagen')?.setValue(null); 
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onCancel(): void {
    this.router.navigate(['home/Categorias']);
  }

  // Getters para facilitar el acceso en el template
  get nombreInvalid() {
    const control = this.categoriaForm.get('nombre');
    return control?.invalid && (control?.dirty || control?.touched);
  }

  get descripcionInvalid() {
    const control = this.categoriaForm.get('descripcion');
    return control?.invalid && (control?.dirty || control?.touched);
  }

  // Getter de validación para la imagen basado en la variable 'selectedFile'
  get imagenInvalid() {
    const control = this.categoriaForm.get('imagen');
    // Consideramos inválida si el formulario se ha intentado enviar y no hay archivo seleccionado
    return this.categoriaForm.touched && !this.selectedFile;
  }


redireccionar(): void {
  this.router.navigate(['/home/Categorias']);
}
}
