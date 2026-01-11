import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuariosService, LoginResponse } from '../../services/PersonServis/usuarios.service';
import { HttpErrorResponse } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../services/aut.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  showPassword: boolean = false;

  throttlingMessage: string | null = null; // Este mensaje AHORA será dinámico
  remainingTime: number = 0; // Sigue siendo el total de segundos
  private countdownSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuariosService: UsuariosService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  get f() { return this.loginForm.controls; }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // --- ¡NUEVA FUNCIÓN UTILITARIA! ---
  /**
   * Formatea un número total de segundos en un string HH:MM:SS o MM:SS.
   * @param totalSeconds El número total de segundos.
   * @returns Un string formateado.
   */
  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    // Rellenar con ceros a la izquierda
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    if (hours > 0) {
      return `${hh}:${mm}:${ss}`; // Formato 01:30:15
    } else {
      return `${mm}:${ss}`; // Formato 05:15
    }
  }

  login(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.throttlingMessage = null;

    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, introduce tu usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    const username = this.f['username'].value;
    const password = this.f['password'].value;

    this.usuariosService.login(username, password).subscribe({
      next: (response: LoginResponse) => {
        // ... (lógica de éxito igual que antes)
        this.isLoading = false;
        this.successMessage = response.message || 'Inicio de sesión exitoso.';
        
        if (response && response.token) {
          this.authService.setToken(response.token);
          setTimeout(() => {
            this.router.navigateByUrl('/home');
          }, 1500);
        } else {
            this.errorMessage = 'Token no recibido';
        }
      },
      error: (errorResponse: HttpErrorResponse) => {
        this.isLoading = false;
        if (errorResponse.status === 429) {
          // --- SECCIÓN MODIFICADA ---
          const message = errorResponse.error?.message || 'Demasiados intentos de inicio de sesión fallidos.';
          const match = message.match(/(\d+)\ssegundos/); // El backend sigue enviando segundos
          let delaySeconds = 0;
          if (match && match[1]) {
            delaySeconds = parseInt(match[1], 10);
          }
          this.remainingTime = delaySeconds;
          
          // ¡Aquí usamos la nueva función de formateo por PRIMERA VEZ!
          this.throttlingMessage = `Demasiados intentos. Podrás intentarlo de nuevo en ${this.formatTime(this.remainingTime)}.`;
          
          this.startCountdown();
          // --- FIN SECCIÓN MODIFICADA ---
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
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    this.loginForm.disable(); // Deshabilita el formulario

    this.countdownSubscription = interval(1000).subscribe(() => {
      // --- LÓGICA DE CONTADOR MODIFICADA ---
      if (this.remainingTime > 0) {
        this.remainingTime--; // Reduce el tiempo
        // ¡Actualiza el mensaje en CADA SEGUNDO!
        this.throttlingMessage = `Demasiados intentos. Podrás intentarlo de nuevo en ${this.formatTime(this.remainingTime)}.`;
      } else {
        this.stopCountdown(); // Detiene cuando llega a cero
      }
      // --- FIN LÓGICA MODIFICADA ---
    });
  }

  private stopCountdown(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = null;
    }
    this.throttlingMessage = null; // Limpia el mensaje de error
    this.remainingTime = 0;
    this.loginForm.enable(); // Rehabilita el formulario
  }

  goToRegister(): void {
    this.router.navigate(['/registrar']);
  }

  goToResetPassword(): void {
    this.router.navigate(['/verificable']);
  }
}