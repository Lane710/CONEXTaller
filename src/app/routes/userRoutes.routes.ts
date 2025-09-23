import { Routes } from '@angular/router';
import { ModificarUserComponent } from '../interfaces/user/modificar-user/modificar-user.component';
import { ListarUserComponent } from '../interfaces/user/listar-user/listar-user.component';
import { RolesUserComponent } from '../interfaces/user/roles-user/roles-user.component';
import { authGuard } from '../guards/auth.guard';



export const userRoutes: Routes = [
  { path: 'modificarUser', component: ModificarUserComponent , canActivate:[authGuard]},
  { path: 'listarUser', component: ListarUserComponent , canActivate:[authGuard]},
  { path: 'rolesUsuario/:id', component: RolesUserComponent , canActivate:[authGuard]},
];