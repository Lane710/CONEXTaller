import { Routes } from '@angular/router';
import { LoginComponent } from './interfaces/login/login.component';
import { HomeComponent } from './interfaces/components/home/home.component';
import { ModificarUserComponent } from './interfaces/user/modificar-user/modificar-user.component';
import { ListarUserComponent } from './interfaces/user/listar-user/listar-user.component';
import { ListarComponent } from './interfaces/Products/listar/listar.component';
import { RegistrarComponent } from './interfaces/Products/registrar/registrar.component';
import { ModificarComponent } from './interfaces/Products/modificar/modificar.component';
import { PruebaComponent } from './interfaces/Products/prueba/prueba.component';
import { RolesUserComponent } from './interfaces/user/roles-user/roles-user.component';
import { RegistrarUserComponent } from './interfaces/user/registrar-user/registrar-user.component';
import { VerificableComponent } from './interfaces/cambio_Pasword/verificable/verificable.component';
import { CambioPasswordComponent } from './interfaces/cambio_Pasword/cambio-password/cambio-password.component';
import { InicioComponent } from './interfaces/components/inicio/inicio.component';
import { HomeGestionComponent } from './interfaces/components/home-gestion/home-gestion.component';
import { DetallesComponent } from './interfaces/Products/detalles/detalles.component';
import { CarritoComponent } from './interfaces/Cart/carrito/carrito.component';


// Asegúrate de que 'routes' se exporte
export const routes: Routes = [
  // Ruta para el login (sin header ni footer)
  { path: 'login', component: LoginComponent },
  { path: 'registrar', component: RegistrarUserComponent},
  { path: 'verificacion', component: VerificableComponent},
  { path: 'cambiarPassword', component: CambioPasswordComponent},

  // Ruta principal del Home, que actuará como layout
  {
    path: 'home',
    component: HomeComponent, // HomeComponent es quien contiene el Header, Footer y su propio router-outlet
    children: [ // Las rutas hijas de 'home'
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }, // Redirige '/home' a '/home/listar' por defecto
      { path: 'inicio', component: InicioComponent}, 
      { path: 'Gestion', component: HomeGestionComponent}, 
      { path: 'modificarUser', component: ModificarUserComponent }, 
      { path: 'listarUser', component: ListarUserComponent }, 
      { path: 'listarProductos', component: ListarComponent }, 
      { path: 'RegistrarProduc', component: RegistrarComponent }, 
      { path: 'modificarProduc/:id', component: ModificarComponent }, 
      { path: 'pru', component: PruebaComponent }, 
      { path: 'rolesUsuario/:id', component: RolesUserComponent }, 
      { path: 'DetailProduct/:id', component: DetallesComponent},
      { path: 'Carrito', component: CarritoComponent},


      // Puedes añadir más rutas hijas aquí
    ]
  },

  // Redirección por defecto al login si no se especifica una ruta o si la ruta es '/'
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' } // Para rutas no definidas, redirigir al login
];