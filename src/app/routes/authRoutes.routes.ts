import { Routes } from '@angular/router';
import { LoginComponent } from '../interfaces/login/login.component';
import { RegistrarUserComponent } from '../interfaces/user/registrar-user/registrar-user.component';
import { VerificableComponent } from '../interfaces/cambio_Pasword/verificable/verificable.component';
import { CambioPasswordComponent } from '../interfaces/cambio_Pasword/cambio-password/cambio-password.component';


export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registrar', component: RegistrarUserComponent },
  { path: 'verificacion', component: VerificableComponent },
  { path: 'cambiarPassword', component: CambioPasswordComponent },
];