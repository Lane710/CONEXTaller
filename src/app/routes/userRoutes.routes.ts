import { Routes } from '@angular/router';
import { ModificarUserComponent } from '../interfaces/user/modificar-user/modificar-user.component';
import { ListarUserComponent } from '../interfaces/user/listar-user/listar-user.component';
import { RolesUserComponent } from '../interfaces/user/roles-user/roles-user.component';



export const userRoutes: Routes = [
  { path: 'modificarUser', component: ModificarUserComponent },
  { path: 'listarUser', component: ListarUserComponent },
  { path: 'rolesUsuario/:id', component: RolesUserComponent },
];