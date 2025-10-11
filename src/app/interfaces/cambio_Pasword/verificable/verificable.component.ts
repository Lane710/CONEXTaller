// src/app/components/verificable/verificable.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { ApiResponse } from '../../../models/api-response';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-verificable',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verificable.component.html',
  styleUrls: ['./verificable.component.css']
})
export class VerificableComponent implements OnInit {

  requestForm!: FormGroup; // Formulario para el email
  isLoading: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuariosService: UsuariosService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  // Inicializa el formulario con el campo de email
  initForm(): void {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^@\s]+@gmail\.com$/i)]] // Solo correos de Gmail
    });
  }

  // Getter para acceder fácilmente al control de email en la plantilla
  get emailControl() { return this.requestForm.controls['email']; }

  // Método para solicitar el código de restablecimiento
  requestResetCode(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.emailControl.markAsTouched(); // Marca el email como tocado para mostrar validaciones

    if (this.requestForm.invalid) {
      this.errorMessage = 'Por favor, introduce un correo electrónico de Gmail válido.';
      return;
    }

    this.isLoading = true;
    const emailToReset = this.emailControl.value;

    this.usuariosService.requestPasswordReset(emailToReset).subscribe({
  next: (response: ApiResponse) => {
    this.isLoading = false;

    if (response.success) {
      // Correo registrado y código enviado
      this.successMessage = response.message;
      localStorage.setItem('resetPasswordEmail', emailToReset);
      setTimeout(() => {
        this.router.navigate(['/cambiarPassword']);
      }, 2000);
    } else {
      // Correo NO registrado
      this.errorMessage = response.message || 'Correo no registrado, inténtelo de nuevo.';
      // No navegamos al siguiente paso
    }
  },
  error: (errorResponse: HttpErrorResponse) => {
    this.isLoading = false;
    this.errorMessage = errorResponse.error?.message || 'Error de conexión. Por favor, inténtalo más tarde.';
    console.error('Error en requestPasswordReset (HTTP Error):', errorResponse);
  }
});

  }

  // Método para navegar a la página de login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
