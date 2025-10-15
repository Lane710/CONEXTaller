import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProveedoresService } from '../../../services/ProductosServis/proveedores-service.service';
import { ApiResponse } from '../../../models/api-response';
import { proveedores } from '../../../models/ProductoStockModel/proveedores';
import { categorias } from '../../../models/ProductoStockModel/categorias';

@Component({
  selector: 'app-editar-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modificar-proveedor.component.html',
  styleUrl: './modificar-proveedor.component.css'
})
export class ModificarProveedorComponent {
  proveedorForm!: FormGroup;
  idProveedor!: number;
  categorias: categorias[] = [];
  procesando: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idProveedor = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.cargarCategorias();
    this.cargarProveedor();
  }

  /** Inicializa el formulario */
  initForm(): void {
    this.proveedorForm = this.fb.group({
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

  /** Cargar proveedor existente por ID */
  cargarProveedor(): void {
    this.proveedoresService.findById(this.idProveedor).subscribe({
      next: (res: ApiResponse) => {
        if (res.success && res.data) {
          const prov: proveedores = res.data;
          this.proveedorForm.patchValue({
            nombreEmpresa: prov.nombreEmpresa,
            nombreContacto: prov.nombreContacto,
            emailContacto: prov.emailContacto,
            telefonoContacto: prov.telefonoContacto,
            ciudad: prov.ciudad,
            pais: prov.pais,
            notas: prov.notas,
            idCategoria: prov.categoria?.idCategoria ?? prov.idCategoria
          });
        } else {
          this.errorMessage = 'Proveedor no encontrado';
        }
      },
      error: (err) => {
        console.error('Error al cargar proveedor:', err);
        this.errorMessage = 'Error al cargar los datos del proveedor.';
      }
    });
  }

  /** Cargar lista de categorías */
  cargarCategorias(): void {
    this.proveedoresService.findAllCategorias().subscribe({
      next: (res: ApiResponse) => {
        if (res.success && Array.isArray(res.data)) {
          this.categorias = res.data;
        } else {
          this.categorias = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  /** Actualiza el proveedor */
  onSubmit(): void {
    if (this.proveedorForm.invalid) {
      this.markAllTouched();
      return;
    }

    this.procesando = true;
    const proveedorActualizado: proveedores = {
      ...this.proveedorForm.value,
      idCategoria: Number(this.proveedorForm.get('idCategoria')?.value)
    };

    this.proveedoresService.update(this.idProveedor, proveedorActualizado).subscribe({
      next: (res: ApiResponse) => {
        this.procesando = false;
        if (res.success) {
          this.mostrarModalExito();
        } else {
          this.errorMessage = res.message || 'Error al actualizar el proveedor.';
        }
      },
      error: (err) => {
        this.procesando = false;
        console.error('Error al actualizar proveedor:', err);
        this.errorMessage = 'Error de conexión con el servidor.';
      }
    });
  }

  /** Marca todos los campos como tocados */
  markAllTouched(): void {
    Object.values(this.proveedorForm.controls).forEach(control => control.markAsTouched());
  }

  mostrarModalExito(): void {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalExito'));
    modal.show();
  }

  redireccionar(): void {
    this.router.navigate(['/home/listadoProveedores']);
  }

  cancelar(): void {
    this.router.navigate(['/home/listadoProveedores']);
  }

  // Getters
  get nombreEmpresa() { return this.proveedorForm.get('nombreEmpresa'); }
  get nombreContacto() { return this.proveedorForm.get('nombreContacto'); }
  get emailContacto() { return this.proveedorForm.get('emailContacto'); }
  get telefonoContacto() { return this.proveedorForm.get('telefonoContacto'); }
  get ciudad() { return this.proveedorForm.get('ciudad'); }
  get pais() { return this.proveedorForm.get('pais'); }
  get notas() { return this.proveedorForm.get('notas'); }
  get idCategoria() { return this.proveedorForm.get('idCategoria'); }
}
