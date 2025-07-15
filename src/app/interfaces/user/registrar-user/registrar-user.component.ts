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
import { UsuariosService } from '../../../services/usuarios.service';
import { personas } from '../../../models/personas';
import { roles } from '../../../models/roles';
import { usuarios } from '../../../models/usuarios';
import { PersonasService } from '../../../services/personas.service';
import { ApiResponse } from '../../../models/api-response';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

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

  // ¡NUEVA PROPIEDAD! Para el atributo max del input de fecha
  maxDateAllowed: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuariosService: UsuariosService,
    private personasService: PersonasService
  ) {}

  ngOnInit(): void {
    this.calculateMaxDate(); // ¡NUEVO! Calcular la fecha máxima al iniciar
    this.initForm();
  }

  // ¡NUEVO MÉTODO! Para calcular la fecha de hace 18 años
  private calculateMaxDate(): void {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    // Formatear a YYYY-MM-DD para el input type="date"
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
            Validators.pattern(/^[^@\s]+@gmail\.com$/i), // Solo correos de Gmail
          ],
        ],
        idRol: [
          1, // Valor por defecto: Asume ID 1 para "CLIENTE" o el rol que desees asignar por defecto
          [Validators.required, Validators.min(1)],
        ],
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
          ci: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]], // ci es el CI en el backend
          telefono: [
            '',
            [Validators.required, Validators.pattern(/^\d{6,15}$/)],
          ],
          direccion: ['', [Validators.required, Validators.maxLength(100)]],
          ciudad: ['', [Validators.required, Validators.maxLength(50)]],
          pais: ['', [Validators.required, Validators.maxLength(50)]],
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
      if (!control.value) {
        return null;
      }
      const selectedDate = new Date(control.value);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      return selectedDate <= currentDate ? null : { dateInFuture: true };
    };
  }

  minAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      if (!control.value) {
        return null;
      }

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
      console.log(
        'Formulario válido. Intentando registrar persona y usuario...'
      );

      const personaData: personas = {
        ci: this.usuarioForm.get('persona.ci')?.value,
        nombre: this.usuarioForm.get('persona.nombre')?.value,
        apellidoP: this.usuarioForm.get('persona.apellidoPaterno')?.value,
        apellidoM: this.usuarioForm.get('persona.apellidoMaterno')?.value,
        fechaNacimiento: this.usuarioForm.get('persona.fechaNacimiento')?.value,
        genero: this.usuarioForm.get('persona.genero')?.value,
        telefono: this.usuarioForm.get('persona.telefono')?.value,
        email: this.usuarioForm.get('email')?.value,
        direccion: this.usuarioForm.get('persona.direccion')?.value,
        ciudad: this.usuarioForm.get('persona.ciudad')?.value,
        pais: this.usuarioForm.get('persona.pais')?.value,
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
      this.usuariosService.findById(newUsuario.username).subscribe({
        next: (existingUser: ApiResponse) => {
          console.log('Usuario existente:', existingUser);
          this.usuariosService.checkIfCiExists(personaData.ci).subscribe({
            next: (ciExists: boolean) => {
              this.usuariosService
                .checkIfEmailExists(newUsuario.email)
                .subscribe({
                  next: (emailExists: boolean) => {
                    this.usuariosService
                      .checkIfPhoneExists(personaData.telefono + '')
                      .subscribe({
                        next: (telefonoExists: boolean) => {
                          if (existingUser.data !== null) {
                            this.isLoading = false;
                            this.errorMessage =
                              'El nombre de usuario ya está registrado. Por favor, utiliza otro nombre de usuario.';
                            return;
                          }
                          if (ciExists == true) {
                            this.isLoading = false;
                            this.errorMessage =
                              'El CI ya está registrado. Por favor, utiliza otro CI.';
                            return;
                          } else if (emailExists) {
                            this.isLoading = false;
                            this.errorMessage =
                              'El correo electrónico ya está registrado. Por favor, utiliza otro correo electrónico.';
                            return;
                          } else if (telefonoExists) {
                            this.isLoading = false;
                            this.errorMessage =
                              'El teléfono ya está registrado. Por favor, utiliza otro teléfono.';
                            return;
                          } else
                            this.personasService
                              .save(personaData)
                              .pipe(
                                catchError((err: HttpErrorResponse) => {
                                  this.isLoading = false;
                                  if (err.status === 409) {
                                    this.errorMessage =
                                      err.error?.message ||
                                      'Error: El ci, correo electrónico o teléfono ya están registrados para otra persona.';
                                  } else {
                                    this.handleError(err, 'persona');
                                  }
                                  return throwError(() => err);
                                })
                              )
                              .subscribe({
                                next: (responsePersona: ApiResponse) => {
                                  if (responsePersona.success) {
                                    console.log(
                                      'Persona registrada exitosamente:',
                                      responsePersona
                                    );

                                    this.usuariosService
                                      .save(newUsuario)
                                      .pipe(
                                        catchError((err: HttpErrorResponse) => {
                                          this.isLoading = false;
                                          if (err.status === 409) {
                                            this.errorMessage =
                                              err.error?.message ||
                                              'Error: El nombre de usuario, correo electrónico o la persona ya están en uso.';
                                          } else {
                                            this.handleError(err, 'usuario');
                                          }
                                          return throwError(() => err);
                                        })
                                      )
                                      .subscribe({
                                        next: (
                                          responseUsuario: ApiResponse
                                        ) => {
                                          this.isLoading = false;
                                          if (responseUsuario.success) {
                                            this.successMessage =
                                              responseUsuario.message ||
                                              'Usuario y persona registrados exitosamente.';
                                            console.log(
                                              'Usuario registrado exitosamente:',
                                              responseUsuario
                                            );
                                            this.initForm();
                                            this.router.navigate(['/login']);
                                          } else {
                                            this.errorMessage =
                                              responseUsuario.message ||
                                              'Error desconocido al registrar usuario.';
                                            console.error(
                                              'Error de registro de usuario (backend lógico):',
                                              responseUsuario
                                            );
                                          }
                                        },
                                        error: (err) => {
                                          console.error(
                                            'Error final en la suscripción del usuario:',
                                            err
                                          );
                                        },
                                      });
                                  } else {
                                    this.isLoading = false;
                                    this.errorMessage =
                                      responsePersona.message ||
                                      'Error desconocido al registrar persona.';
                                    console.error(
                                      'Error de registro de persona (backend lógico):',
                                      responsePersona
                                    );
                                  }
                                },
                                error: (err) => {
                                  console.error(
                                    'Error final en la suscripción de la persona:',
                                    err
                                  );
                                },
                              });
                        },
                      });
                  },
                });
            },
          });
        },
      });
    } else {
      this.errorMessage = 'Por favor, corrige los errores del formulario.';
      console.error('El formulario es inválido. Errores detallados:');
      this.logFormErrors(this.usuarioForm);
    }
  }

  private handleError(
    err: HttpErrorResponse,
    entityType: 'persona' | 'usuario'
  ): void {
    console.error(`Error al registrar ${entityType} (HTTP):`, err);

    if (err.error && err.error.message) {
      this.errorMessage = err.error.message;
    } else if (err.status === 0) {
      this.errorMessage =
        'No se pudo conectar con el servidor. Asegúrate de que el backend está corriendo en http://localhost:8080.';
    } else if (err.status >= 400 && err.status < 500) {
      this.errorMessage = `Error en la solicitud para ${entityType}: ${
        err.status
      } - ${err.statusText}. Por favor, verifica los datos. ${
        err.error?.detail || err.error?.error || ''
      }`;
    } else if (err.status >= 500) {
      this.errorMessage = `Error interno del servidor al registrar ${entityType}: ${
        err.status
      } - ${err.statusText}. Por favor, inténtalo de nuevo más tarde. ${
        err.error?.detail || err.error?.error || ''
      }`;
    } else {
      this.errorMessage = `Hubo un problema al registrar ${entityType}.`;
    }
  }

  private logFormErrors(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.logFormErrors(control);
      } else if (control && control.invalid) {
        console.log(
          `Control: '${key}', Estado: ${control.status}, Errores:`,
          control.errors
        );
      }
    });
    if (formGroup.errors) {
      console.log('Errores a nivel de Form Group:', formGroup.errors);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
