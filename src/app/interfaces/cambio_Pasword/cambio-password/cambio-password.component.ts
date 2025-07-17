// src/app/components/cambio-password/cambio-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { ApiResponse } from '../../../models/api-response';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-cambio-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cambio-password.component.html',
  styleUrls: ['./cambio-password.component.css']
})
export class CambioPasswordComponent implements OnInit {

  passwordResetForm!: FormGroup; // Formulario para token y nueva contraseña
  emailForReset: string | null = null; // Almacena el email recibido del componente anterior

  isLoading: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuariosService: UsuariosService
  ) { }

  ngOnInit(): void {
    // Recupera el email del localStorage
    this.emailForReset = localStorage.getItem('resetPasswordEmail');

    if (!this.emailForReset) {
      this.errorMessage = 'No se encontró el correo electrónico para restablecer la contraseña. Por favor, inicia el proceso desde la página de restablecimiento.';
      // Opcional: Redirigir al usuario a la página de solicitud de código
      // this.router.navigate(['/verificable']);
    }

    this.initForm();
  }

  // Inicializa el formulario con validadores para token y contraseñas
  initForm(): void {
    this.passwordResetForm = this.fb.group({
      token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]], // Código de 6 dígitos
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/) // Al menos una mayúscula, una minúscula, un número y un carácter especial
      ]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator() }); // Validador personalizado para coincidencia de contraseñas
  }

  // Validador personalizado para asegurar que las contraseñas coincidan
  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const password = control.get('newPassword');
      const confirmPassword = control.get('confirmNewPassword');

      // Solo valida si ambos campos existen y si la confirmación ha sido tocada
      if (!password || !confirmPassword || !confirmPassword.touched) {
        return null;
      }

      // Si las contraseñas no coinciden, devuelve un error
      if (password.value !== confirmPassword.value) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  // Getters para acceder fácilmente a los controles del formulario en la plantilla
  get f() { return this.passwordResetForm.controls; }
  get p() { return this.passwordResetForm.get('newPassword'); } // Para acceder a newPassword
  get cp() { return this.passwordResetForm.get('confirmNewPassword'); } // Para acceder a confirmNewPassword

  // Métodos para verificar la complejidad de la contraseña (para el HTML)
  get hasMinLength(): boolean { return this.p?.value?.length >= 8; }
  get hasUpperCase(): boolean { return /[A-Z]/.test(this.p?.value); }
  get hasLowerCase(): boolean { return /[a-z]/.test(this.p?.value); }
  get hasNumber(): boolean { return /\d/.test(this.p?.value); }
  get hasSymbol(): boolean { return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(this.p?.value); }
  get passwordsMatch(): boolean { return this.p?.value === this.cp?.value && (this.p?.value?.length > 0 || this.cp?.value?.length > 0); }


  // Método para restablecer la contraseña
  resetPassword(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.passwordResetForm.markAllAsTouched(); // Marca todos los campos como tocados

    // Validar el formulario antes de enviar
    if (this.passwordResetForm.invalid) {
      this.errorMessage = 'Por favor, corrige los errores del formulario.';
      return;
    }

    if (!this.emailForReset) {
      this.errorMessage = 'El correo electrónico para el restablecimiento no está disponible.';
      return;
    }

    this.isLoading = true;
    const token = this.passwordResetForm.get('token')?.value;
    const newPassword = this.passwordResetForm.get('newPassword')?.value;

    this.usuariosService.resetPassword(this.emailForReset, token, newPassword).subscribe({
      next: (response: ApiResponse) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message;
          // Limpia el email del localStorage después de un restablecimiento exitoso
          localStorage.removeItem('resetPasswordEmail');
          // Redirige al usuario a la página de login después de un éxito
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000); // Redirige después de 3 segundos
        } else {
          this.errorMessage = response.message || 'Error desconocido al restablecer la contraseña.';
        }
      },
      error: (errorResponse: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = errorResponse.error?.message || 'Error de conexión al restablecer la contraseña. Inténtalo de nuevo.';
        console.error('Error en resetPassword:', errorResponse);
      }
    });
  }

  // Método para volver a la página de solicitud de código
  goToRequestCodePage(): void {
    this.router.navigate(['/verificable']);
  }

  // Método para navegar a la página de login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
