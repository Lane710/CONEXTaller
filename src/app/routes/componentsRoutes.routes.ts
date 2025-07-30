import { Routes } from '@angular/router';
import { InicioComponent } from '../interfaces/components/inicio/inicio.component';
import { HomeGestionComponent } from '../interfaces/components/home-gestion/home-gestion.component';
import { productsRoutes } from './productsRoutes.routes';
import { userRoutes } from './userRoutes.routes';
import { ventasOnline } from './ventasOnline.routes';


// Importa las rutas de los otros módulos


export const componentsRoutes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'Gestion', component: HomeGestionComponent },

  // Extiende las rutas de los otros módulos
  ...productsRoutes,
  ...userRoutes,
  ...ventasOnline
];