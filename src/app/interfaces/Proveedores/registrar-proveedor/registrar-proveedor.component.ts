import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProveedoresService } from '../../../services/ProductosServis/proveedores-service.service';
import { ApiResponse } from '../../../models/api-response';
import { proveedores } from '../../../models/ProductoStockModel/proveedores';

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

  constructor(
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService,
    private router: Router
  ) {
    const today = new Date();
    this.maxDateAllowed = today.toISOString().split('T')[0];
    this.proveedorForm = this.createForm();
this.proveedorForm = this.createForm();
  }

  ngOnInit(): void {
    // No se cargan categorías
  }

  /** Crear el formulario */
  createForm(): FormGroup {
    return this.fb.group({
      nombreEmpresa: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      nombreContacto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
emailContacto: ['', [
        Validators.required, 
        Validators.email,
        // Esta regex exige que termine en @gmail.com
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/) 
      ]],
telefonoContacto: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]],
      ciudad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      pais: ['', [Validators.required]],
      notas: ['', [Validators.maxLength(500)]]
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
      estado: true
    };

    const { nombreEmpresa, emailContacto, telefonoContacto } = proveedorData;

    // Verificar existencia
    this.proveedoresService
      .verificarExistenciaProveedor(nombreEmpresa || '', emailContacto || '', telefonoContacto || '00000000')
      .subscribe({
        // ✅ --- LÓGICA NUEVA ---
        // 'next' solo se ejecuta si el backend devuelve HTTP 200 (OK),
        // lo que significa que NO se encontraron duplicados.
        next: (resVerificacion: ApiResponse) => {
          // Si no existe (éxito), registrar proveedor
          this.guardarProveedor(proveedorData);
        },

        // ✅ --- LÓGICA NUEVA ---
        // 'error' se ejecuta si el backend devuelve un error,
        // incluyendo el HTTP 409 (Conflict) que configuramos.
        error: (err: any) => {
          this.procesando = false;
          console.error('Error al verificar existencia:', err);

          // Verificamos si es el error 409 que esperamos
          if (err.status === 409 && err.error?.data) {
            this.errorMessage = err.error.message || 'Se encontraron datos duplicados.';
            
            // 'err.error.data' es el Mapa de errores que viene del backend
            const errores = err.error.data; 

            // Asignar error SÓLO al campo que está duplicado
            if (errores.nombreEmpresa) {
              this.nombreEmpresa?.setErrors({ exists: true });
              this.nombreEmpresa?.markAsTouched();
            }
            if (errores.emailContacto) {
              this.emailContacto?.setErrors({ exists: true });
              this.emailContacto?.markAsTouched();
            }
            if (errores.telefonoContacto) {
              this.telefonoContacto?.setErrors({ exists: true });
              this.telefonoContacto?.markAsTouched();
            }
          } else {
            // Otro tipo de error (500, red, etc.)
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
    this.router.navigate(['/home/listaProveedores']);
  }

  cancelar(): void {
    this.router.navigate(['/home/listaProveedores']);
  }

  // Getters para los campos
  get nombreEmpresa() { return this.proveedorForm.get('nombreEmpresa'); }
  get nombreContacto() { return this.proveedorForm.get('nombreContacto'); }
  get emailContacto() { return this.proveedorForm.get('emailContacto'); }
  get telefonoContacto() { return this.proveedorForm.get('telefonoContacto'); }
  get ciudad() { return this.proveedorForm.get('ciudad'); }
  get pais() { return this.proveedorForm.get('pais'); }
  get notas() { return this.proveedorForm.get('notas'); }
}