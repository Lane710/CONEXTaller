import { Routes } from '@angular/router';
import { ModificarUserComponent } from '../interfaces/user/modificar-user/modificar-user.component';
import { ListarUserComponent } from '../interfaces/user/listar-user/listar-user.component';
import { RolesUserComponent } from '../interfaces/user/roles-user/roles-user.component';
import { authGuard } from '../guards/auth.guard';
import { ListadoProveedorComponent } from '../interfaces/Proveedores/listado-proveedor/listado-proveedor.component';
import { RegistrarProveedorComponent } from '../interfaces/Proveedores/registrar-proveedor/registrar-proveedor.component';
import { ModificarProveedorComponent } from '../interfaces/Proveedores/modificar-proveedor/modificar-proveedor.component';
import { ModificarUsuarioComponent } from '../interfaces/ClienteOnline/modificar-usuario/modificar-usuario.component';

export const userRoutes: Routes = [
  {
    path: 'modificarUser',
    component: ModificarUserComponent,
    canActivate: [authGuard],
  },
  {
    path: 'listarUser',
    component: ListarUserComponent,
    canActivate: [authGuard],
  },
  {
    path: 'rolesUsuario/:id',
    component: RolesUserComponent,
    canActivate: [authGuard],
  },
  { path: 'listaProveedores', component: ListadoProveedorComponent },
  { path: 'registrarProveedores', component: RegistrarProveedorComponent },
  {
    path: 'proveedores/editar/:id',
    component: ModificarProveedorComponent,
  },
  {
    path:'modificarUserHeader', component: ModificarUsuarioComponent, canActivate:[authGuard]
  }
];
