import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface JwtPayload {
  sub: string;   // username
  idUsuario: number;
  rol: string;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userRoleSubject = new BehaviorSubject<string | null>(null);
  public userRole$ = this.userRoleSubject.asObservable();

  constructor(private router: Router) {
    this.initFromToken();
  }

  // Inicializa los datos desde el token si ya existe
  private initFromToken() {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded) {
        this.userRoleSubject.next(decoded.rol);
        localStorage.setItem('current_username', decoded.sub);
        localStorage.setItem('idUsuario', decoded.idUsuario.toString());
        localStorage.setItem('rol', decoded.rol);
      }
    }
  }

  public getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  public decodeToken(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Error al decodificar token:', e);
      return null;
    }
  }

  public getUsername(): string | null {
    return localStorage.getItem('current_username');
  }

  public getRole(): string | null {
    return localStorage.getItem('rol');
  }

  public getIdUsuario(): number | null {
    const id = localStorage.getItem('idUsuario');
    return id ? Number(id) : null;
  }

  public hasRole(role: string): boolean {
    return this.getRole() === role;
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_username');
    localStorage.removeItem('rol');
    localStorage.removeItem('idUsuario');
    this.userRoleSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Llamar al login y guardar token + decodificar rol
  public setToken(token: string) {
    localStorage.setItem('jwt_token', token);
    const decoded = this.decodeToken(token);
    if (decoded) {
      localStorage.setItem('rol', decoded.rol);
      localStorage.setItem('current_username', decoded.sub);
      localStorage.setItem('idUsuario', decoded.idUsuario.toString());
      this.userRoleSubject.next(decoded.rol);
    }
  }
}
