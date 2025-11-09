import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProveedoresService } from '../../../services/ProductosServis/proveedores-service.service';
import { ApiResponse } from '../../../models/api-response';
import { proveedores } from '../../../models/ProductoStockModel/proveedores';
// 🛑 Import de 'categorias' eliminado

@Component({
selector: 'app-editar-proveedor',
standalone: true,
imports: [CommonModule, ReactiveFormsModule],
templateUrl: './modificar-proveedor.component.html',
styleUrls: ['./modificar-proveedor.component.css'] // 👈 Asegúrate que este archivo CSS exista
})
export class ModificarProveedorComponent implements OnInit { // 👈 Añadido OnInit
proveedorForm!: FormGroup;
idProveedor!: number;
// 🛑 'categorias' eliminado
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
// 🛑 'cargarCategorias()' eliminado
this.cargarProveedor();
}

/** Inicializa el formulario */
initForm(): void {
this.proveedorForm = this.fb.group({
nombreEmpresa: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
nombreContacto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
emailContacto: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
      ]],
telefonoContacto: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]],
ciudad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
pais: ['', [Validators.required]],
notas: ['', [Validators.maxLength(500)]]
      // 🛑 'idCategoria' eliminado
});
}

/** Cargar proveedor existente por ID */
cargarProveedor(): void {
this.proveedoresService.findById(this.idProveedor).subscribe({
next: (res: ApiResponse) => {
if (res.success && res.data) {
const prov: proveedores = res.data;
// patchValue rellena los campos que coinciden
this.proveedorForm.patchValue(prov); 
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

// 🛑 'cargarCategorias()' eliminado

/** Actualiza el proveedor */
onSubmit(): void {
if (this.proveedorForm.invalid) {
this.markAllTouched();
return;
}

this.procesando = true;
    this.errorMessage = '';
    this.successMessage = '';
    
const proveedorActualizado: proveedores = {
...this.proveedorForm.value
      // 🛑 'idCategoria' eliminado
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
        
        // ✅ Manejo del error 409 (Conflict) desde el backend
if (err.status === 409 && err.error?.data) {
this.errorMessage = err.error.message || 'Se encontraron datos duplicados.';
const errores = err.error.data; 

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
this.errorMessage = 'Error de conexión con el servidor.';
}
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
this.router.navigate(['/home/listaProveedores']);
}

cancelar(): void {
this.router.navigate(['/home/listaProveedores']);
}

// Getters
get nombreEmpresa() { return this.proveedorForm.get('nombreEmpresa'); }
get nombreContacto() { return this.proveedorForm.get('nombreContacto'); }
get emailContacto() { return this.proveedorForm.get('emailContacto'); }
get telefonoContacto() { return this.proveedorForm.get('telefonoContacto'); }
get ciudad() { return this.proveedorForm.get('ciudad'); }
get pais() { return this.proveedorForm.get('pais'); }
get notas() { return this.proveedorForm.get('notas'); }
// 🛑 Getter 'idCategoria' eliminado
}