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
  
  // Nueva propiedad para controlar la visibilidad de la contraseña
  showPassword: boolean = false;

  throttlingMessage: string | null = null;
  remainingTime: number = 0;
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

  // Nueva función para alternar la visibilidad de la contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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
          const message = errorResponse.error?.message || 'Demasiados intentos de inicio de sesión fallidos.';
          const match = message.match(/(\d+)\ssegundos/);
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
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
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
    this.throttlingMessage = null;
    this.remainingTime = 0;
    this.loginForm.enable();
  }

  goToRegister(): void {
    this.router.navigate(['/registrar']);
  }

  goToResetPassword(): void {
    this.router.navigate(['/verificable']);
  }
}