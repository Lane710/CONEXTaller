// src/app/components/modificar-user/modificar-user.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { usuarios } from '../../../models/PersonModel/usuarios';
import { personas } from '../../../models/PersonModel/personas';
import { roles } from '../../../models/PersonModel/roles';

import { UsuariosService } from '../../../services/PersonServis/usuarios.service';

import { ApiResponse } from '../../../models/api-response';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PersonasService } from '../../../services/PersonServis/personas.service';

declare var bootstrap: any;

@Component({
  selector: 'app-modificar-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modificar-user.component.html',
  styleUrl: './modificar-user.component.css'
})
export class ModificarUserComponent implements OnInit, AfterViewInit {

  usuarioForm!: FormGroup;
  userUsername!: string;
  userToModify: usuarios | null = null;
  errorMessage: string | null = null;
  successMessage: string = '';
  isLoading: boolean = false;
  maxDateAllowed: string = '';

  imageUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  @ViewChild('messageModal') messageModalRef!: ElementRef;
  private messageModal: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuariosService: UsuariosService,
    private personasService: PersonasService
  ) {
    this.setMaxDateAllowed();
  }

  ngOnInit(): void {
    this.initForm();

    this.usuarioForm.get('password')?.valueChanges.subscribe(passwordValue => {
      const confirmPasswordControl = this.usuarioForm.get('confirmPassword');
      if (passwordValue && passwordValue.trim() !== '') {
        confirmPasswordControl?.setValidators([Validators.required, this.passwordMatchValidator()]);
      } else {
        confirmPasswordControl?.clearValidators();
      }
      confirmPasswordControl?.updateValueAndValidity();
      this.usuarioForm.updateValueAndValidity();
    });

    this.route.params.subscribe(params => {
      const usernameFromUrl = params['username'];
      const usernameFromLocalStorage = localStorage.getItem('ModUser');

      if (usernameFromUrl) {
        this.userUsername = usernameFromUrl;
        this.loadUser(this.userUsername);
      } else if (usernameFromLocalStorage) {
        this.userUsername = usernameFromLocalStorage;
        this.loadUser(this.userUsername);
        localStorage.removeItem('ModUser');
      } else {
        this.errorMessage = 'ID de usuario (username) no proporcionado.';
        console.error('ID de usuario (username) no proporcionado para modificar.');
        this.showMessageModal();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.messageModalRef) {
      this.messageModal = new bootstrap.Modal(this.messageModalRef.nativeElement);
    }
  }

  setMaxDateAllowed(): void {
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    this.maxDateAllowed = this.formatDateForInput(eighteenYearsAgo.toISOString().split('T')[0]);
  }

  initForm(): void {
    this.usuarioForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
        password: ['', [Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/)]],
        confirmPassword: [''],
        email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^@\s]+@gmail\.com$/i)]],
        persona: this.fb.group({
          ci: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{7,20}$/)]],
          nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
          apellidoP: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
          apellidoM: ['', [Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)]],
          telefono: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]],
          direccion: ['', [Validators.required, Validators.maxLength(100)]],
          ciudad: ['', [Validators.required, Validators.maxLength(50)]],
          departamento: [''],
          pais: ['', [Validators.required, Validators.maxLength(50)]],
          codigoPostal: [''],
          fechaNacimiento: ['', [Validators.required, this.dateNotInFutureValidator(), this.minAgeValidator(18)]],
          genero: ['', Validators.required],
        })
      },
      {
        validator: this.passwordMatchValidator()
      }
    );
  }

  loadUser(username: string): void {
    this.isLoading = true;
    this.usuariosService.findById(username).pipe(
      catchError((err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cargar el usuario: ' + (err.error?.message || err.message || 'Error desconocido');
        console.error('Error HTTP al cargar usuario:', err);
        this.showMessageModal();
        return of(null);
      })
    ).subscribe((response: ApiResponse | null) => {
      if (!response || !response.success || !response.data) {
        this.errorMessage = response?.message || 'No se pudo cargar el usuario.';
        console.error('Error al cargar usuario (backend):', response);
        this.showMessageModal();
        return;
      }

      this.userToModify = response.data as usuarios;
      const persona = this.userToModify.persona;
      const fechaNacimientoFormato = persona.fechaNacimiento ? this.formatDateForInput(persona.fechaNacimiento) : '';

      if (persona.fotoUrl) {
        this.imageUrl = persona.fotoUrl;
      } else {
        this.imageUrl = null;
      }

      this.usuarioForm.patchValue({
        username: this.userToModify.username,
        email: this.userToModify.email,
        persona: {
          ci: persona.ci || '',
          nombre: persona.nombre || '',
          apellidoP: persona.apellidop || '',
          apellidoM: persona.apellidom || '',
          telefono: persona.telefono || '',
          direccion: persona.direccion || '',
          ciudad: persona.ciudad || '',
          departamento: persona.departamento || '',
          pais: persona.pais || '',
          codigoPostal: persona.codigoPostal || '',
          fechaNacimiento: fechaNacimientoFormato,
          genero: persona.genero || '',
        },
      });

      this.usuarioForm.get('username')?.disable();
      this.usuarioForm.get('persona.ci')?.disable();

      this.usuarioForm.markAsPristine();
      this.usuarioForm.markAsUntouched();
      this.isLoading = false;
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file: File = input.files[0];

      const fileTypeErrors = this.fileTypeValidator(file);
      const fileSizeErrors = this.fileSizeValidator(file);

      if (fileTypeErrors || fileSizeErrors) {
        this.selectedFile = null;
        this.imageUrl = null;
        let errorMsg = '';
        if (fileTypeErrors) errorMsg += 'Tipo de archivo no permitido (solo JPG, PNG, GIF). ';
        if (fileSizeErrors) errorMsg += 'La imagen excede el tamaño máximo (2MB).';
        this.errorMessage = errorMsg;
        this.showMessageModal();
        this.usuarioForm.markAsDirty();
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = e => {
        this.imageUrl = reader.result;
      };
      reader.readAsDataURL(file);

      this.errorMessage = null;
      this.usuarioForm.markAsDirty();
    } else {
      this.selectedFile = null;
      this.imageUrl = this.userToModify?.persona?.fotoUrl || null; // Restore existing URL if no new file selected
      this.errorMessage = null;
      this.usuarioForm.markAsDirty();
    }
  }

  fileTypeValidator(file: File): ValidationErrors | null {
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return { fileType: true };
      }
    }
    return null;
  }

  fileSizeValidator(file: File): ValidationErrors | null {
    if (file) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        return { fileSize: true };
      }
    }
    return null;
  }

  onModify(): void {
    this.errorMessage = null;
    this.successMessage = '';

    this.usuarioForm.get('username')?.enable();
    this.usuarioForm.get('persona.ci')?.enable();

    this.usuarioForm.markAllAsTouched();

    if (this.usuarioForm.invalid) {
      this.errorMessage = 'Por favor, corrige los errores del formulario antes de actualizar.';
      this.showMessageModal();
      this.usuarioForm.get('username')?.disable();
      this.usuarioForm.get('persona.ci')?.disable();
      return;
    }

    this.isLoading = true;

    const formValue = this.usuarioForm.getRawValue();

    const updatedPersona: personas = {
      ci: formValue.persona.ci,
      nombre: formValue.persona.nombre,
      apellidop: formValue.persona.apellidoP,
      apellidom: formValue.persona.apellidoM,
      telefono: formValue.persona.telefono,
      direccion: formValue.persona.direccion,
      ciudad: formValue.persona.ciudad,
      departamento: formValue.persona.departamento,
      pais: formValue.persona.pais,
      codigoPostal: formValue.persona.codigoPostal,
      fechaNacimiento: formValue.persona.fechaNacimiento,
      genero: formValue.persona.genero,
      email: formValue.email,
      // CORRECCIÓN: Usar 'undefined' en lugar de 'null' si no hay nueva foto ni foto existente
      fotoUrl: (this.selectedFile === null && this.imageUrl === null) ? undefined : this.userToModify?.persona?.fotoUrl
    };

    const updatedUser: usuarios = {
      username: formValue.username,
      passwordHash: formValue.password ? formValue.password : this.userToModify!.passwordHash,
      email: formValue.email,
      estado: this.userToModify?.estado,
      fechaCreacion: this.userToModify?.fechaCreacion,
      rol: this.userToModify!.rol,
      persona: updatedPersona // Pasamos el objeto updatedPersona completo
    };

    forkJoin([
      this.personasService.update(updatedPersona, updatedPersona.ci, this.selectedFile || undefined).pipe(
        catchError((err) => {
          console.error('Error al actualizar persona:', err);
          return of({ success: false, message: this.getErrorMessageFromHttpError(err, 'persona'), data: null, httpStatusCode: err.status });
        })
      ) as Observable<ApiResponse>,
      this.usuariosService.update(updatedUser, this.userUsername).pipe(
        catchError((err) => {
          console.error('Error al actualizar usuario:', err);
          return of({ success: false, message: this.getErrorMessageFromHttpError(err, 'usuario'), data: null, httpStatusCode: err.status });
        })
      ) as Observable<ApiResponse>
    ]).subscribe({
      next: ([personaRes, usuarioRes]) => {
        let allSuccess = true;
        let messages: string[] = [];

        if (personaRes.success) {
          messages.push('Datos personales actualizados exitosamente.');
          if (this.selectedFile && personaRes.data && personaRes.data.fotoUrl) {
            this.imageUrl = personaRes.data.fotoUrl;
            this.selectedFile = null;
          }
        } else {
          messages.push(personaRes.message || 'Error desconocido al actualizar los datos personales.');
          allSuccess = false;
        }

        if (usuarioRes.success) {
          messages.push('Datos de usuario actualizados exitosamente.');
        } else {
          messages.push(usuarioRes.message || 'Error desconocido al actualizar los datos de usuario.');
          allSuccess = false;
        }

        if (allSuccess) {
          this.successMessage = messages.join('\n');
          this.errorMessage = null;
          this.usuarioForm.markAsPristine();
          this.usuarioForm.markAsUntouched();
        } else {
          this.errorMessage = messages.join('\n');
          this.successMessage = '';
        }
        this.showMessageModal();
      },
      error: (err) => {
        console.error('Error fatal al intentar actualizar usuario y persona:', err);
        this.errorMessage = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
        this.showMessageModal();
      }
    }).add(() => {
      this.isLoading = false;
      this.usuarioForm.get('username')?.disable();
      this.usuarioForm.get('persona.ci')?.disable();
    });
  }

  private getErrorMessageFromHttpError(err: HttpErrorResponse, entityType: 'persona' | 'usuario'): string {
    if (err.error && err.error.message) {
      return err.error.message;
    } else if (err.status === 0) {
      return `No se pudo conectar con el servidor para ${entityType}. Asegúrate de que el backend está corriendo.`;
    } else if (err.status === 409) {
      return `Conflicto de datos para ${entityType}: El nombre de usuario, CI o correo electrónico/teléfono ya están en uso.`;
    } else if (err.status >= 400 && err.status < 500) {
      if (err.error && err.error.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
        return `Error en la solicitud para ${entityType}: ${err.error.errors[0].defaultMessage || 'Datos inválidos.'}`;
      }
      return `Error en la solicitud para ${entityType}: ${err.status}. ${err.error?.detail || err.error?.error || 'Error desconocido.'}`;
    } else if (err.status >= 500) {
      return `Error interno del servidor para ${entityType}: ${err.status}. Inténtalo de nuevo más tarde.`;
    } else {
      return `Hubo un problema desconocido al actualizar ${entityType}.`;
    }
  }

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');

      if (password && confirmPassword && password.value) {
        if (password.value !== confirmPassword.value) {
          return { passwordMismatch: true };
        }
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

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error('Error al formatear fecha para input:', dateString, e);
      return '';
    }
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

  showMessageModal(): void {
    if (this.messageModal) {
      this.messageModal.show();
    }
  }

  closeMessageModalAndNavigate(): void {
    if (this.messageModal) {
      this.messageModal.hide();
    }
    if (!this.errorMessage && this.successMessage) {
        this.router.navigate(['/home/listarUser']);
    } else {
      this.errorMessage = null;
    }
  }

  goToUserList(): void {
    this.router.navigate(['/home/listarUser']);
  }
}
