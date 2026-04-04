import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  ValidatorFn,
} from '@angular/forms';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { personas } from '../../../models/PersonModel/personas';
import { roles } from '../../../models/PersonModel/roles';
import { usuarios } from '../../../models/PersonModel/usuarios';
import Modal from 'bootstrap/js/dist/modal';

import { ApiResponse } from '../../../models/api-response';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-registrar-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-user.component.html',
  styleUrl: './registrar-user.component.css',
})
export class RegistrarUserComponent implements OnInit {
  usuarioForm!: FormGroup;
  successMessage: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;

  maxDateAllowed: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuariosService: UsuariosService,
  ) {}

  ngOnInit(): void {
    this.calculateMaxDate();
    this.initForm();
  }

  private calculateMaxDate(): void {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    this.maxDateAllowed = today.toISOString().split('T')[0];
  }

  initForm(): void {
    this.usuarioForm = this.fb.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(20),
            Validators.pattern(/^[a-zA-Z0-9_]+$/),
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.pattern(/^[^@\s]+@gmail\.com$/i),
          ],
        ],
        idRol: [1, [Validators.required, Validators.min(1)]],
        persona: this.fb.group({
          nombre: [
            '',
            [
              Validators.required,
              Validators.minLength(3),
              Validators.maxLength(50),
              Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
            ],
          ],
          apellidoPaterno: [
            '',
            [
              Validators.required,
              Validators.minLength(3),
              Validators.maxLength(50),
              Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
            ],
          ],
          apellidoMaterno: [
            '',
            [
              Validators.minLength(3),
              Validators.maxLength(50),
              Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/),
            ],
          ],
          ci: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
          
          // 🔥 CAMPOS OPCIONALES (Sin Validators.required) 🔥
          telefono: ['', [Validators.pattern(/^\d{6,15}$/)]],
          direccion: ['', [Validators.maxLength(100)]],
          ciudad: ['', [Validators.maxLength(50)]],
          pais: ['', [Validators.maxLength(50)]],
          
          fechaNacimiento: [
            '',
            [
              Validators.required,
              this.dateNotInFutureValidator(),
              this.minAgeValidator(18),
            ],
          ],
          genero: ['', Validators.required],
        }),
      },
      { validators: this.passwordMatchValidator() }
    );
  }

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');
      if (!password || !confirmPassword || !confirmPassword.touched) {
        return null;
      }
      if (password.value !== confirmPassword.value) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  dateNotInFutureValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      if (!control.value) return null;
      const selectedDate = new Date(control.value);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      return selectedDate <= currentDate ? null : { dateInFuture: true };
    };
  }

  minAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      if (!control.value) return null;

      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= minAge ? null : { minAge: true };
    };
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = '';
    this.usuarioForm.markAllAsTouched();

    if (this.usuarioForm.valid) {
      this.isLoading = true;
      console.log('Formulario válido. Enviando datos al backend...');

      // Capturamos los datos. Si los opcionales están vacíos, se envían como strings vacíos (o nulos).
      const personaData: personas = {
        ci: this.usuarioForm.get('persona.ci')?.value,
        nombre: this.usuarioForm.get('persona.nombre')?.value,
        apellidop: this.usuarioForm.get('persona.apellidoPaterno')?.value,
        apellidom: this.usuarioForm.get('persona.apellidoMaterno')?.value,
        fechaNacimiento: this.usuarioForm.get('persona.fechaNacimiento')?.value,
        genero: this.usuarioForm.get('persona.genero')?.value,
        telefono: this.usuarioForm.get('persona.telefono')?.value || null,
        email: this.usuarioForm.get('email')?.value,
        direccion: this.usuarioForm.get('persona.direccion')?.value || null,
        ciudad: this.usuarioForm.get('persona.ciudad')?.value || null,
        pais: this.usuarioForm.get('persona.pais')?.value || null,
      };

      const rolData: roles = {
        idRol: this.usuarioForm.get('idRol')?.value,
        nombreRol: '',
        descripcion: '',
      };

      const newUsuario: usuarios = {
        username: this.usuarioForm.get('username')?.value,
        passwordHash: this.usuarioForm.get('password')?.value,
        email: this.usuarioForm.get('email')?.value,
        estado: 1,
        rol: rolData,
        persona: personaData,
      };

      this.usuariosService.save(newUsuario).subscribe({
        next: (responseUsuario: ApiResponse) => {
          this.isLoading = false;
          if (responseUsuario.success) {
            this.successMessage = responseUsuario.message || 'Usuario registrado exitosamente.';
            console.log('Registro exitoso:', responseUsuario);
            this.initForm();

            const modalElement = document.getElementById('modalExito');
            if (modalElement) {
              const modalExito = new Modal(modalElement);
              modalExito.show();
            }
          } else {
            this.errorMessage = responseUsuario.message || 'Error desconocido al registrar usuario.';
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.handleError(err);
        },
      });

    } else {
      this.errorMessage = 'Por favor, corrige los errores del formulario.';
      this.logFormErrors(this.usuarioForm);
    }
  }

  private handleError(err: HttpErrorResponse): void {
    console.error('Error al registrar usuario:', err);

    if (err.status === 409 || err.status === 400) {
      this.errorMessage = err.error?.message || 'El nombre de usuario, correo electrónico o CI ya están en uso por otra cuenta web.';
    } else if (err.status === 0) {
      this.errorMessage = 'No se pudo conectar con el servidor.';
    } else {
      this.errorMessage = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    }
  }

  private logFormErrors(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.logFormErrors(control);
      } else if (control && control.invalid) {
        console.log(`Control: '${key}', Estado: ${control.status}, Errores:`, control.errors);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  redireccionar(): void {
    this.router.navigate(['/login']);
  }
}