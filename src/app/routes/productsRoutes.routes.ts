import { Routes } from '@angular/router';
import { ListarComponent } from '../interfaces/Products/listar/listar.component';
import { RegistrarComponent } from '../interfaces/Products/registrar/registrar.component';
import { ModificarComponent } from '../interfaces/Products/modificar/modificar.component';
import { PruebaComponent } from '../interfaces/Products/prueba/prueba.component';
import { DetallesComponent } from '../interfaces/Products/detalles/detalles.component';
import { CarritoComponent } from '../interfaces/Cart/carrito/carrito.component';
import { authGuard } from '../guards/auth.guard';


export const productsRoutes: Routes = [
  { path: 'listarProductos', component: ListarComponent, canActivate:[authGuard],data:{roles:['administrador']}},
  { path: 'RegistrarProduc', component: RegistrarComponent , canActivate:[authGuard],data:{roles:['administrador']}},
  { path: 'modificarProduc/:id', component: ModificarComponent , canActivate:[authGuard]},
  { path: 'pru', component: PruebaComponent },
  { path: 'DetailProduct/:id', component: DetallesComponent , canActivate:[authGuard]},
  {path: 'Carrito',component:CarritoComponent   } 
];