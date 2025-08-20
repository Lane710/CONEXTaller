import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/aut.service';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
  return true; // Usuario logueado → puede entrar
} else {
    router.navigate(['/login']); // No está logueado → redirige
    return false;
  }
};
