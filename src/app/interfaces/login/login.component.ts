// src/app/components/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Importa ReactiveFormsModule y FormBuilder
import { Router, RouterLink } from '@angular/router'; // Asegúrate de importar RouterLink
import { UsuariosService, LoginResponse } from '../../services/PersonServis/usuarios.service'; // Asegúrate de que la ruta sea correcta
import { HttpErrorResponse } from '@angular/common/http';
import { interval, Subscription } from 'rxjs'; // Importa interval y Subscription

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule], // Usa ReactiveFormsModule
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm!: FormGroup; // Declara el FormGroup
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  throttlingMessage: string | null = null;
  remainingTime: number = 0;
  private countdownSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder, // Inyecta FormBuilder
    private router: Router,
    private usuariosService: UsuariosService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    // Asegúrate de limpiar la suscripción del contador para evitar fugas de memoria
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  // Inicializa el formulario con validadores
  initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  // Getter para acceder fácilmente a los controles del formulario en la plantilla
  get f() { return this.loginForm.controls; }

  login(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.throttlingMessage = null; // Limpia el mensaje de throttling al intentar iniciar sesión

    this.loginForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar validaciones

    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, introduce tu usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    const username = this.f['username'].value; // Accede a los valores del formulario reactivo
    const password = this.f['password'].value; // Accede a los valores del formulario reactivo

    this.usuariosService.login(username, password).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Inicio de sesión exitoso.';
        localStorage.setItem('usuario_actual', response.Usuario + '');

        // El token y el ID de usuario ya se guardaron en localStorage dentro de UsuariosService.login()
        if (response && response.token) {
          // Redirige al usuario a la página principal o dashboard
          setTimeout(() => {
            this.router.navigateByUrl('/home'); // Ajusta esta ruta según tu aplicación
          }, 1500);
        }
      },
      error: (errorResponse: HttpErrorResponse) => {
        this.isLoading = false;
        if (errorResponse.status === 429) { // Código de estado HTTP 429 (Too Many Requests)
          // Extrae el tiempo de la respuesta del backend
          const message = errorResponse.error?.message || 'Demasiados intentos de inicio de sesión fallidos.';
          const match = message.match(/(\d+)\ssegundos/); // Busca el número de segundos
          let delaySeconds = 0;
          if (match && match[1]) {
            delaySeconds = parseInt(match[1], 10);
          }

          this.throttlingMessage = message;
          this.remainingTime = delaySeconds;
          this.startCountdown();
        } else if (errorResponse.status === 401 || errorResponse.status === 403) {
          this.errorMessage = 'Nombre de usuario o contraseña incorrectos.';
        } else if (errorResponse.status >= 500) {
          this.errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
        } else {
          this.errorMessage = 'Error de conexión. Asegúrate de que el servidor esté funcionando.';
        }
        console.error('Error al intentar login:', errorResponse);
      }
    });
  }

  private startCountdown(): void {
    // Limpia cualquier suscripción existente para evitar múltiples contadores
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }

    // Deshabilita el formulario mientras el contador está activo
    this.loginForm.disable();

    this.countdownSubscription = interval(1000).subscribe(() => {
      this.remainingTime--;
      if (this.remainingTime <= 0) {
        this.stopCountdown();
      }
    });
  }

  private stopCountdown(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = null;
    }
    this.throttlingMessage = null; // Limpia el mensaje de throttling
    this.remainingTime = 0; // Asegura que el tiempo restante sea 0
    this.loginForm.enable(); // Habilita el formulario cuando el contador termina
  }

  goToRegister(): void {
    this.router.navigate(['/registrar']); // Ajusta esta ruta si tu registro está en otro lugar
  }

  goToResetPassword(): void {
    this.router.navigate(['/verificable']); // Redirige al componente de restablecimiento de contraseña
  }
}
