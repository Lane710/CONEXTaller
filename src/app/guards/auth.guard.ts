import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/aut.service';

/**
 * Lista de rutas públicas. Si una ruta está en esta lista,
 * no requerirá un token para ser visitada.
 */
const PUBLIC_ROUTES: string[] = [
  '/login',
  '/home/inicio',
  '/home',
  '/tienda',
  '/contacto',
  // Agrega aquí todas las demás rutas que no necesiten autenticación
];

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // 1. Verifica si la ruta a la que se intenta acceder es pública
  const isPublicRoute = PUBLIC_ROUTES.includes(state.url);
  if (isPublicRoute) {
    return true; 
  }
  
  // 2. Si la ruta no es pública, verifica si el usuario está autenticado
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  
  // 3. Lógica para verificar el rol
  const requiredRoles = route.data['roles'] as string[];
  const userRole = authService.getRole(); // <-- Tu método para obtener el rol del usuario

  // Si la ruta no tiene roles definidos en la configuración, permite el acceso
  if (!requiredRoles) {
    return true;
  }
  
  // Si el rol del usuario está incluido en la lista de roles requeridos
  if (userRole && requiredRoles.includes(userRole)) {
    return true; // El rol coincide, permite el acceso
  }

  // 4. Acceso denegado: el rol del usuario no está permitido
  alert('Acceso denegado. No tienes los permisos necesarios.');
  router.navigate(['/home/inicio']);
  return false;
};