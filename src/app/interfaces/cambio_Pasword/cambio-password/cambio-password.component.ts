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

  passwordResetForm!: FormGroup;
  emailForReset: string | null = null;
  codeInputs: string[] = ['', '', '', '', '', '']; // Array para los 6 dígitos

  isLoading: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuariosService: UsuariosService
  ) { }

  ngOnInit(): void {
    this.emailForReset = localStorage.getItem('resetPasswordEmail');

    if (!this.emailForReset) {
      this.errorMessage = 'No se encontró el correo electrónico para restablecer la contraseña. Por favor, inicia el proceso desde la página de restablecimiento.';
    }

    this.initForm();
  }

  initForm(): void {
    this.passwordResetForm = this.fb.group({
      token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/)
      ]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator() });
  }

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const password = control.get('newPassword');
      const confirmPassword = control.get('confirmNewPassword');

      if (!password || !confirmPassword || !confirmPassword.touched) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  // Métodos para manejar el código de 6 dígitos
  onCodeInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;
    
    // Solo permitir números
    if (!/^\d*$/.test(value)) {
      input.value = '';
      this.codeInputs[index] = '';
      return;
    }
    
    this.codeInputs[index] = value;
    
    // Mover al siguiente input si se ingresó un dígito
    if (value && index < 5) {
      const nextInput = document.querySelectorAll('.code-input')[index + 1] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    this.updateTokenValue();
  }

  onCodeKeyDown(event: any, index: number): void {
    // Manejar tecla backspace
    if (event.key === 'Backspace') {
      if (!this.codeInputs[index] && index > 0) {
        // Si el campo actual está vacío, borrar el anterior
        const prevInput = document.querySelectorAll('.code-input')[index - 1] as HTMLInputElement;
        if (prevInput) {
          this.codeInputs[index - 1] = '';
          prevInput.value = '';
          prevInput.focus();
        }
      } else {
        // Si hay valor, limpiar el campo actual
        this.codeInputs[index] = '';
      }
      this.updateTokenValue();
    }
  }

  onCodeFocus(event: any): void {
    // Seleccionar todo el texto al hacer focus
    event.target.select();
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text');
    
    if (pasteData && /^\d{6}$/.test(pasteData)) {
      // Pegar el código completo en los 6 campos
      for (let i = 0; i < 6; i++) {
        this.codeInputs[i] = pasteData[i];
        const input = document.querySelectorAll('.code-input')[i] as HTMLInputElement;
        if (input) {
          input.value = pasteData[i];
        }
      }
      this.updateTokenValue();
      
      // Mover focus al último campo
      const lastInput = document.querySelectorAll('.code-input')[5] as HTMLInputElement;
      if (lastInput) {
        lastInput.focus();
      }
    }
  }

  updateTokenValue(): void {
    const token = this.codeInputs.join('');
    this.passwordResetForm.patchValue({ token });
    
    // Validar automáticamente
    const tokenControl = this.passwordResetForm.get('token');
    if (tokenControl) {
      tokenControl.updateValueAndValidity();
    }
  }

  // Getters para acceder fácilmente a los controles del formulario en la plantilla
  get f() { return this.passwordResetForm.controls; }
  get p() { return this.passwordResetForm.get('newPassword'); }
  get cp() { return this.passwordResetForm.get('confirmNewPassword'); }

  // Métodos para verificar la complejidad de la contraseña
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
    this.passwordResetForm.markAllAsTouched();

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
          localStorage.removeItem('resetPasswordEmail');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
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
    this.router.navigate(['/verificacion']);
  }

  // Método para navegar a la página de login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}