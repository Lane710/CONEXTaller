import { Routes } from '@angular/router';
import { HomeComponent } from './interfaces/components/home/home.component';
import { authRoutes } from './routes/authRoutes.routes';
import { componentsRoutes } from './routes/componentsRoutes.routes';

// Importa los conjuntos de rutas subdivididas


export const routes: Routes = [
  // Rutas de autenticación y acceso (sin layout de Home)
  ...authRoutes, // Incluye login, registrar, verificación, cambiarPassword

  // Ruta principal del Home, que actuará como layout
  {
    path: 'home',component: HomeComponent, // HomeComponent es quien contiene el Header, Footer y su propio router-outlet
    children: [ // Las rutas hijas de 'home' ahora vienen de componentsRoutes
      ...componentsRoutes // Incluye inicio, gestión, productos, usuarios, carrito, etc.
    ]
  },

  // Redirección por defecto y manejo de rutas no encontradas
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' } // Para rutas no definidas, redirigir al home
];