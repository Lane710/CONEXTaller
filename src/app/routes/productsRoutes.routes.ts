import { Routes } from '@angular/router';
import { ListarComponent } from '../interfaces/Products/listar/listar.component';
import { RegistrarComponent } from '../interfaces/Products/registrar/registrar.component';
import { ModificarComponent } from '../interfaces/Products/modificar/modificar.component';
import { PruebaComponent } from '../interfaces/Products/prueba/prueba.component';
import { DetallesComponent } from '../interfaces/Products/detalles/detalles.component';
import { CarritoComponent } from '../interfaces/Cart/carrito/carrito.component';


export const productsRoutes: Routes = [
  { path: 'listarProductos', component: ListarComponent },
  { path: 'RegistrarProduc', component: RegistrarComponent },
  { path: 'modificarProduc/:id', component: ModificarComponent },
  { path: 'pru', component: PruebaComponent },
  { path: 'DetailProduct/:id', component: DetallesComponent },
  {path: 'Carrito',component:CarritoComponent   } 
];