import { Routes } from '@angular/router';
import { InicioComponent } from '../interfaces/components/inicio/inicio.component';
import { HomeGestionComponent } from '../interfaces/components/home-gestion/home-gestion.component';
import { productsRoutes } from './productsRoutes.routes';
import { userRoutes } from './userRoutes.routes';
import { ventasOnline } from './ventasOnline.routes';
import { ventasStore } from './ventasStore.routes';
import { clients } from './Client/client.routes';
import { StoreComponent } from '../interfaces/Store/store/store.component';
import { ReporteRouter } from './Reportes.routes';


// Importa las rutas de los otros módulos


export const componentsRoutes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'Gestion', component: HomeGestionComponent },
  { path: 'Store', component: StoreComponent },


  // Extiende las rutas de los otros módulos
  ...productsRoutes,
  ...userRoutes,
  ...ventasOnline,
  ...ventasStore,
  ...clients,
  ...ReporteRouter
];