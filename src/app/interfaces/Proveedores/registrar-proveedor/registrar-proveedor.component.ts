import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProveedoresService } from '../../../services/ProductosServis/proveedores-service.service';
import { ApiResponse } from '../../../models/api-response';
import { proveedores } from '../../../models/ProductoStockModel/proveedores';
import { categorias } from '../../../models/ProductoStockModel/categorias';

@Component({
  selector: 'app-registrar-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-proveedor.component.html',
  styleUrls: ['./registrar-proveedor.component.css']
})
export class RegistrarProveedorComponent implements OnInit {
  proveedorForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  procesando: boolean = false;
  maxDateAllowed: string;
  categorias: categorias[] = [];

  constructor(
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService,
    private router: Router
  ) {
    const today = new Date();
    this.maxDateAllowed = today.toISOString().split('T')[0];
    this.proveedorForm = this.createForm();
  }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  /** Cargar las categorías */
  cargarCategorias(): void {
    this.proveedoresService.findAllCategorias().subscribe({
      next: (res: ApiResponse) => {
        if (res.success && Array.isArray(res.data)) {
          this.categorias = res.data;
        } else {
          console.error('Respuesta inválida del backend al listar categorías:', res);
          this.categorias = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.categorias = [];
      }
    });
  }

  /** Crear el formulario */
  createForm(): FormGroup {
    return this.fb.group({
      nombreEmpresa: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      nombreContacto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      emailContacto: ['', [Validators.required, Validators.email]],
      telefonoContacto: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]],
      ciudad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      pais: ['', [Validators.required]],
      notas: ['', [Validators.maxLength(500)]],
      idCategoria: ['', [Validators.required]]
    });
  }

  /** Enviar formulario */
  onSubmit(): void {
    if (this.proveedorForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    this.procesando = true;
    this.errorMessage = '';
    this.successMessage = '';

    const proveedorData: proveedores = {
      ...this.proveedorForm.value,
      idCategoria: Number(this.proveedorForm.get('idCategoria')?.value),
      estado: true
    };

    const { nombreEmpresa, emailContacto, telefonoContacto } = proveedorData;

    // Verificar existencia
    this.proveedoresService
  .verificarExistenciaProveedor(nombreEmpresa || '', emailContacto || '', telefonoContacto || '00000000')
  .subscribe({
    next: (resVerificacion: ApiResponse) => {
      // Si el backend devuelve data=true, se puede mostrar mensaje también
      if (resVerificacion.data === true) {
        this.procesando = false;
        this.errorMessage = resVerificacion.message || 'Ya existe un proveedor con esos datos.';

        // Marcar errores en los campos
        this.nombreEmpresa?.setErrors({ exists: true });
        this.emailContacto?.setErrors({ exists: true });
        this.telefonoContacto?.setErrors({ exists: true });

        this.nombreEmpresa?.markAsTouched();
        this.emailContacto?.markAsTouched();
        this.telefonoContacto?.markAsTouched();

        return;
      }

      // Si no existe, registrar proveedor
      this.guardarProveedor(proveedorData);
    },
    error: (err: any) => {
      this.procesando = false;
      console.error('Error al verificar existencia:', err);

      // Si es un 409, mostrar mensaje específico del backend
      if (err.status === 409 && err.error?.message) {
        this.errorMessage = err.error.message;

        // Marcar errores en los campos
        this.nombreEmpresa?.setErrors({ exists: true });
        this.emailContacto?.setErrors({ exists: true });
        this.telefonoContacto?.setErrors({ exists: true });

        this.nombreEmpresa?.markAsTouched();
        this.emailContacto?.markAsTouched();
        this.telefonoContacto?.markAsTouched();
      } else {
        this.errorMessage = 'Error al verificar el proveedor. Intente nuevamente.';
      }
    }
  });
  }
guardarProveedor(proveedorData: proveedores) {
  this.proveedoresService.save(proveedorData).subscribe({
    next: (resSave: ApiResponse) => {
      this.procesando = false;
      if (resSave.success) {
        this.mostrarModalExito();
      } else {
        this.errorMessage = resSave.message || 'Error al registrar el proveedor.';
      }
    },
    error: (err) => {
      this.procesando = false;
      console.error('Error en el registro:', err);
      this.errorMessage = 'Error de conexión con el servidor. Intente nuevamente.';
    }
  });
}

  /** Marca todos los campos como tocados */
  marcarCamposComoTocados(): void {
    Object.keys(this.proveedorForm.controls).forEach(key => {
      const control = this.proveedorForm.get(key);
      control?.markAsTouched();
    });
  }

  /** Mostrar modal de éxito */
  mostrarModalExito(): void {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalExito'));
    modal.show();
  }

  /** Redirecciones */
  redireccionar(): void {
    this.router.navigate(['/home/listadoProveedores']);
  }

  cancelar(): void {
    this.router.navigate(['/home/listadoProveedores']);
  }

  // Getters para los campos
  get nombreEmpresa() { return this.proveedorForm.get('nombreEmpresa'); }
  get nombreContacto() { return this.proveedorForm.get('nombreContacto'); }
  get emailContacto() { return this.proveedorForm.get('emailContacto'); }
  get telefonoContacto() { return this.proveedorForm.get('telefonoContacto'); }
  get ciudad() { return this.proveedorForm.get('ciudad'); }
  get pais() { return this.proveedorForm.get('pais'); }
  get notas() { return this.proveedorForm.get('notas'); }
  get idCategoria() { return this.proveedorForm.get('idCategoria'); }
}
