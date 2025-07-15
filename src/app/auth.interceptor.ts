// src/app/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http'; // ¡Importa HttpInterceptorFn!
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http'; // ¡Importa HttpHandlerFn!
import { Observable } from 'rxjs';

// Define el interceptor como una función, no como una clase
export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn // Cambiado de HttpHandler a HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  // Excluir la URL de login para evitar un bucle infinito
  // Ya que la solicitud de login aún no tiene el token
  if (request.url.includes('/api/auth/login')) {
    return next(request); // Llama a 'next' como una función
  }

  const token = localStorage.getItem('jwt_token'); // Obtén el token del almacenamiento local

  if (token) {
    // Clona la solicitud y añade el encabezado de autorización
    const cloned = request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned); // Llama a 'next' como una función
  } else {
    // Si no hay token, simplemente envía la solicitud original
    return next(request); // Llama a 'next' como una función
  }
};