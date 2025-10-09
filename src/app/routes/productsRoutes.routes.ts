import { Routes } from '@angular/router';
import { ListarComponent } from '../interfaces/Products/listar/listar.component';
import { RegistrarComponent } from '../interfaces/Products/registrar/registrar.component';
import { ModificarComponent } from '../interfaces/Products/modificar/modificar.component';
import { PruebaComponent } from '../interfaces/Products/prueba/prueba.component';
import { DetallesComponent } from '../interfaces/Products/detalles/detalles.component';
import { CarritoComponent } from '../interfaces/Cart/carrito/carrito.component';
import { authGuard } from '../guards/auth.guard';
import { CategoriasComponent } from '../interfaces/categoriasAndSub/categorias/categorias.component';
import { RegistrarCategoriaComponent } from '../interfaces/categoriasAndSub/categorias/registrar-categoria/registrar-categoria.component';
import { SubcategoriasComponent } from '../interfaces/categoriasAndSub/sub-categorias/sub-categorias.component';
import { RegistrarSubcategoriaComponent } from '../interfaces/categoriasAndSub/sub-categorias/registrar-sub-categoria/registrar-sub-categoria.component';


export const productsRoutes: Routes = [
  { path: 'listarProductos', component: ListarComponent, canActivate:[authGuard],data:{roles:['administrador']}},
  { path: 'RegistrarProduc', component: RegistrarComponent , canActivate:[authGuard],data:{roles:['administrador']}},
  { path: 'modificarProduc/:id', component: ModificarComponent , canActivate:[authGuard]},
  { path: 'pru', component: PruebaComponent },
  { path: 'DetailProduct/:id', component: DetallesComponent , canActivate:[authGuard]},
  {path: 'Carrito',component:CarritoComponent   } ,
  {path: 'Categorias',component:CategoriasComponent},
  {path: 'Categorias/Registro',component:RegistrarCategoriaComponent},
  {path: 'Categorias/SubCategorias/:categoriaId', component:SubcategoriasComponent},
  {path: 'Categorias/SubCategorias/Registro/:categoriaId', component:RegistrarSubcategoriaComponent}
];