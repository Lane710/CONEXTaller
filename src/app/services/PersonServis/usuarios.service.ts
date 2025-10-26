// src/app/services/usuarios.service.ts
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { usuarios } from '../../models/PersonModel/usuarios';
import { roles } from '../../models/PersonModel/roles';

// Revisa el nombre de la propiedad y el tipo de ID según tu backend
export interface LoginResponse {
  Usuario?: string; // Si el backend devuelve el username del usuario logeado
  message: string;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  // ¡MUY IMPORTANTE! Cambia el puerto a 8081
  private apiUrl = 'http://localhost:8080/usuarios/';
  private apiUrlRoles = 'http://localhost:8080/roles/';
  private loginAuthUrl = 'http://localhost:8080/user/'; // Asegúrate de que esta ruta sea correcta para tu login

  
  constructor(private http: HttpClient) {}

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }

  // Cambiado id de String a string
  findById(username: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${username}`);
  }

  // Cambiado 'usuarios' a 'Usuario'
  save(usuario: usuarios): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, usuario);
  }

  // Cambiado 'usuarios' a 'Usuario' y 'id' de String a string
  update(usuario: usuarios, username: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.apiUrl}updateById/${username}`,
      usuario
    );
  }

  // Cambiado 'id' de number a string
  deleteByUsername(username: string): Observable<ApiResponse> {
    // Renombrado para mayor claridad
    return this.http.delete<ApiResponse>(
      `${this.apiUrl}deleteByUsername/${username}`
    ); // Ajusta tu endpoint backend si es necesario
  }

  // 'password' es el campo que se envía al backend, no 'passwordHash'
  login(username: string, password: string): Observable<LoginResponse> {
    const credentials = { username: username, passwordHash: password }; // Envía la contraseña sin hashear desde el frontend

    return this.http
      .post<LoginResponse>(`${this.loginAuthUrl}login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem('usuario_actual', response.Usuario + '');
        localStorage.setItem('current_username', response.Usuario+'');
        localStorage.setItem('jwt_token',response.token);
        })
      );
  }

  roles(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrlRoles}findAll`);
  }

  // Cambiado 'userId' de number a string
  updateUserRole(username: string, newRoleId: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.apiUrl}updateUserRole/${username}/${newRoleId}`,
      {}
    );
  }

  // NUEVO MÉTODO PARA CAMBIAR ROL POR NOMBRE
  cambiarRolUsuario(username: string, nuevoRol: string): Observable<ApiResponse> {
    const requestBody = { rol: nuevoRol };
    return this.http.put<ApiResponse>(
      `${this.apiUrl}${username}/rol`,
      requestBody
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al cambiar el rol del usuario:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error al cambiar el rol del usuario',
          data: null,
          httpStatusCode: error.status || 500,
        } as ApiResponse);
      })
    );
  }

  verifyEmailAndPhone(
    email: string,
    telefono: string
  ): Observable<ApiResponse> {
    let params = new HttpParams();
    if (email) {
      params = params.append('email', email);
    }
    if (telefono) {
      params = params.append('telefono', telefono);
    }
    // Asumiendo que el endpoint para verificación también está en la ruta de usuarios
    return this.http.get<ApiResponse>(`${this.apiUrl}verifyEmailAndPhone`, {
      params,
    });
  }

  // Cambiado 'userId' de number a string y 'roles' a 'Rol'
  getRoleByUsername(username: string): Observable<ApiResponse> {
    // Renombrado para mayor claridad
    return this.http
      .get<ApiResponse>(`${this.apiUrl}getRoleByUsername/${username}`)
      .pipe(
        // Ajusta tu endpoint backend
        tap((response) => {
         
        }),
        catchError((error: HttpErrorResponse) => {
          
          return of({
            success: false,
            message:
              'Error en la solicitud para obtener rol: ' +
              (error.message || 'Error desconocido del servidor'),
            data: null,
            httpStatusCode: (error.status || 500).toString(),
          } as ApiResponse);
        })
      );
  }

  // Cambiado 'id' de number a string
  toggleUserStatus(username: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.apiUrl}toggleStatus/${username}`,
      {}
    );
  }

  checkIfCiExists(ci: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}checkCiExists/${ci}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al verificar CI:', error);
        // Si hay un error (ej. 403, 500, o de red), es seguro asumir false para no bloquear el formulario
        return of(false);
      })
    );
  }

  checkIfEmailExists(email: string): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.apiUrl}checkEmailExists/${email}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al verificar email:', error);
          return of(false);
        })
      );
  }
  checkIfPasswordExistsForUser(username: string): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.apiUrl}checkPasswordExistsForUser/${username}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al verificar nombre de usuario:', error);
          return of(false);
        })
      );
  }

  checkIfPhoneExists(telefono: string): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.apiUrl}checkPhoneExists/${telefono}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al verificar teléfono:', error);
          return of(false);
        })
      );
  }

  requestPasswordReset(email: string): Observable<ApiResponse> {
    // El backend espera el email como raw text/plain en el body
    // HttpClient.post con un string como body envía Content-Type: text/plain por defecto
    return this.http
      .post<ApiResponse>(`${this.apiUrl}request-password-reset`, email)
      .pipe(
        catchError((error) => {
          console.error('Error en requestPasswordReset:', error);
          return of({
            success: false,
            message:
              error.error?.message ||
              'Error al solicitar el restablecimiento de contraseña.',
            data: null,
            httpStatusCode: error.status || 500,
          });
        })
      );
  }

  resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Observable<ApiResponse> {
    // Los parámetros 'email' y 'token' van en la URL como query parameters
    // La 'newPassword' va en el body como raw text/plain
    let params = new HttpParams().set('email', email).set('token', token);

    return this.http
      .post<ApiResponse>(`${this.apiUrl}reset-password`, newPassword, {
        params,
      })
      .pipe(
        catchError((error) => {
          console.error('Error en resetPassword:', error);
          return of({
            success: false,
            message:
              error.error?.message || 'Error al restablecer la contraseña.',
            data: null,
            httpStatusCode: error.status || 500,
          });
        })
      );
  }

  /**
   * Obtiene la lista de usuarios con rol de Trabajador, Dueña o Administrador.
   * Llama al endpoint GET /usuarios/findTrabajadoresParaFiltro.
   * @returns Un Observable con la ApiResponse que contiene la lista de UsuarioFiltro.
   */
  findTrabajadoresParaFiltro(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findTrabajadoresParaFiltro`);
  }
}