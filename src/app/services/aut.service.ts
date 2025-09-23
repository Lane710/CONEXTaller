// En src/app/services/aut.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface JwtPayload {
  sub: string;
  idUsuario: number;
  rol: string;
  exp: number;
}

// Nueva interfaz para el estado del usuario
export interface UserState {
  username: string | null;
  role: string | null;
  idUsuario: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userStateSubject = new BehaviorSubject<UserState>({
    username: null,
    role: null,
    idUsuario: null,
  });
  public userState$ = this.userStateSubject.asObservable();

  constructor(private router: Router) {
    this.initFromToken();
  }

  private initFromToken() {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded && this.isTokenValid(decoded)) {
        this.userStateSubject.next({
          username: decoded.sub,
          role: decoded.rol,
          idUsuario: decoded.idUsuario,
        });
        localStorage.setItem('current_username', decoded.sub);
        localStorage.setItem('idUsuario', decoded.idUsuario.toString());
        localStorage.setItem('rol', decoded.rol);
      } else {
        this.logout();
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

  private isTokenValid(decodedToken: JwtPayload): boolean {
    const now = Date.now() / 1000;
    return decodedToken.exp > now;
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const decoded = this.decodeToken(token);
    if (!decoded || !this.isTokenValid(decoded)) {
      this.logout();
      return false;
    }
    return true;
  }

  public hasRole(role: string): boolean {
    const userState = this.userStateSubject.value;
    return userState.role === role;
  }

  public getRole(): string | null {
    const userState = this.userStateSubject.value;
    return userState.role;
  }

  public logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_username');
    localStorage.removeItem('rol');
    localStorage.removeItem('idUsuario');
    this.userStateSubject.next({
      username: null,
      role: null,
      idUsuario: null,
    });
    this.router.navigate(['/home']);
  }

  public setToken(token: string) {
    localStorage.setItem('jwt_token', token);
    const decoded = this.decodeToken(token);
    if (decoded && this.isTokenValid(decoded)) {
      this.userStateSubject.next({
        username: decoded.sub,
        role: decoded.rol,
        idUsuario: decoded.idUsuario,
      });
      localStorage.setItem('rol', decoded.rol);
      localStorage.setItem('current_username', decoded.sub);
      localStorage.setItem('idUsuario', decoded.idUsuario.toString());
    } else {
      this.logout();
    }
  }
}
