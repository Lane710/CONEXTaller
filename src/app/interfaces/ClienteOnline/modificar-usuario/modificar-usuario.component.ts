import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { usuarios } from '../../../models/PersonModel/usuarios';
import { personas } from '../../../models/PersonModel/personas';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { PersonasService } from '../../../services/PersonServis/personas.service';
import { ApiResponse } from '../../../models/api-response';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

declare var bootstrap: any;

@Component({
  selector: 'app-modificar-usuario',
   imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modificar-usuario.component.html',
  styleUrl: './modificar-usuario.component.css'
})
export class ModificarUsuarioComponent implements OnInit, AfterViewInit {
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

    this.route.params.subscribe((params) => {
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
    this.maxDateAllowed = this.formatDateForInput(eighteenYearsAgo);
  }

  initForm(): void {
    this.usuarioForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.pattern(/^[^@\s]+@gmail\.com$/i)],
      ],
      persona: this.fb.group({
        ci: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{7,20}$/)]],
        nombre: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          ],
        ],
        apellidoP: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          ],
        ],
        apellidoM: [
          '',
          [
            Validators.minLength(3),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/),
          ],
        ],
        telefono: ['', [Validators.pattern(/^\d{6,15}$/)]],
        direccion: ['', [Validators.maxLength(100)]],
        ciudad: ['', [Validators.maxLength(50)]],
        departamento: [''],
        pais: ['', [Validators.maxLength(50)]],
        codigoPostal: [''],
        fechaNacimiento: [
          '',
          [Validators.required, this.dateNotInFutureValidator(), this.minAgeValidator(18)],
        ],
        genero: ['', Validators.required],
      }),
    });
  }

  loadUser(username: string): void {
    this.isLoading = true;
    this.usuariosService
      .findByIdMod(username)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage =
            'Error al cargar el usuario: ' +
            (err.error?.message || err.message || 'Error desconocido');
          this.showMessageModal();
          return of(null);
        })
      )
      .subscribe((response: ApiResponse | null) => {
        if (!response || !response.success || !response.data) {
          this.errorMessage = response?.message || 'No se pudo cargar el usuario.';
          this.showMessageModal();
          return;
        }

        this.userToModify = response.data as usuarios;
        const persona = this.userToModify.persona;
        const fechaNacimientoFormato = persona.fechaNacimiento
          ? this.formatDateForInput(persona.fechaNacimiento)
          : '';

        this.imageUrl = persona.fotoUrl || null;

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

        // NOTA: Se eliminaron los '.disable()' para permitir la edición de username, ci, email y telefono

        this.usuarioForm.markAsPristine();
        this.usuarioForm.markAsUntouched();
        this.isLoading = false;
      });
  }

  dateNotInFutureValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selected = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      return selected <= today ? null : { dateInFuture: true };
    };
  }

  minAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age >= minAge ? null : { minAge: true };
    };
  }

  private formatDateForInput(dateString: string | Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  showMessageModal(): void {
    if (this.messageModal) this.messageModal.show();
  }

  closeMessageModalAndNavigate(): void {
    if (this.messageModal) this.messageModal.hide();
    if (!this.errorMessage && this.successMessage) {
      this.router.navigate(['/home']);
    } else {
      this.errorMessage = null;
    }
  }

  goToUserList(): void {
    this.router.navigate(['/home']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const typeError = this.fileTypeValidator(file);
      const sizeError = this.fileSizeValidator(file);

      if (typeError || sizeError) {
        this.selectedFile = null;
        this.imageUrl = null;
        this.errorMessage = `${typeError ? 'Tipo no permitido. ' : ''}${sizeError ? 'Máx. 2MB.' : ''}`;
        this.showMessageModal();
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.imageUrl = reader.result);
      reader.readAsDataURL(file);

      this.usuarioForm.markAsDirty();
    }
  }

  fileTypeValidator(file: File): ValidationErrors | null {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    return allowed.includes(file.type) ? null : { fileType: true };
  }

  fileSizeValidator(file: File): ValidationErrors | null {
    const maxSize = 2 * 1024 * 1024;
    return file.size <= maxSize ? null : { fileSize: true };
  }

  onModify(): void {
    this.errorMessage = null;
    this.successMessage = '';
    
    this.usuarioForm.markAllAsTouched();

    if (this.usuarioForm.invalid) {
      this.errorMessage = 'Por favor, corrige los errores del formulario antes de actualizar.';
      this.showMessageModal();
      return;
    }

    this.isLoading = true;
    const formValue = this.usuarioForm.getRawValue();

    const updatedPersona: personas = {
      ci: formValue.persona.ci,
      nombre: formValue.persona.nombre,
      apellidop: formValue.persona.apellidoP,
      apellidom: formValue.persona.apellidoM || null,
      telefono: formValue.persona.telefono || null,
      direccion: formValue.persona.direccion || null,
      ciudad: formValue.persona.ciudad || null,
      departamento: formValue.persona.departamento || null,
      pais: formValue.persona.pais || null,
      codigoPostal: formValue.persona.codigoPostal || null,
      fechaNacimiento: formValue.persona.fechaNacimiento,
      genero: formValue.persona.genero,
      email: formValue.email,
      fotoUrl:
        this.selectedFile === null && this.imageUrl === null
          ? undefined
          : this.userToModify?.persona?.fotoUrl,
    };

    const updatedUser: usuarios = {
      username: formValue.username,
      // 🔥 ENVIAR SIEMPRE VACÍO. 
      // Al recibir un string vacío, el "if" de tu backend ignorará este campo 
      // y mantendrá la contraseña original intacta en la base de datos.
      passwordHash: '', 
      email: formValue.email,
      estado: this.userToModify?.estado,
      fechaCreacion: this.userToModify?.fechaCreacion,
      rol: this.userToModify!.rol,
      persona: updatedPersona,
    };

    forkJoin([
      this.personasService
        .update(updatedPersona, this.userToModify!.persona.ci, this.selectedFile || undefined)
        .pipe(
          catchError((err) =>
            of({
              success: false,
              message: this.getErrorMessageFromHttpError(err, 'persona'),
              data: null,
              httpStatusCode: err.status,
            })
          )
        ) as Observable<ApiResponse>,
      this.usuariosService.update(updatedUser, this.userUsername).pipe(
        catchError((err) =>
          of({
            success: false,
            message: this.getErrorMessageFromHttpError(err, 'usuario'),
            data: null,
            httpStatusCode: err.status,
          })
        )
      ) as Observable<ApiResponse>,
    ])
      .subscribe({
        next: ([personaRes, usuarioRes]) => {
          const messages: string[] = [];
          let allSuccess = true;

          if (personaRes.success) {
            messages.push('Datos personales actualizados exitosamente.');
            if (this.selectedFile && personaRes.data?.fotoUrl) {
              this.imageUrl = personaRes.data.fotoUrl;
              this.selectedFile = null;
            }
          } else {
            messages.push(personaRes.message || 'Error al actualizar datos personales.');
            allSuccess = false;
          }

          if (usuarioRes.success) {
            messages.push('Datos de usuario actualizados exitosamente.');
          } else {
            messages.push(usuarioRes.message || 'Error al actualizar usuario.');
            allSuccess = false;
          }

          if (allSuccess) {
            this.successMessage = messages.join('\n');
            this.errorMessage = null;
          } else {
            this.errorMessage = messages.join('\n');
            this.successMessage = '';
          }

          this.showMessageModal();
        },
        error: (err) => {
          console.error('Error inesperado:', err);
          this.errorMessage = 'Ocurrió un error inesperado.';
          this.showMessageModal();
        },
      })
      .add(() => {
        this.isLoading = false;
      });
  }

  private getErrorMessageFromHttpError(err: HttpErrorResponse, entity: 'persona' | 'usuario'): string {
    if (err.error?.message) return err.error.message;
    if (err.status === 0) return `No se pudo conectar con el servidor (${entity}).`;
    // Se actualizó este mensaje para incluir el teléfono
    if (err.status === 409 || err.status === 400)
      return `Conflicto de datos (${entity}): nombre de usuario, CI, teléfono o correo ya están en uso.`;
    if (err.status >= 400 && err.status < 500)
      return `Error ${err.status} (${entity}): ${err.error?.detail || 'Datos inválidos.'}`;
    if (err.status >= 500)
      return `Error interno del servidor (${entity}): ${err.status}.`;
    return `Error desconocido al actualizar ${entity}.`;
  }
}