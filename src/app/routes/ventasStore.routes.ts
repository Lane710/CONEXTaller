import { Routes } from "@angular/router";
import { ListSalesComponent } from "../interfaces/storeSale/list-sales/list-sales.component";
import { SalesComponent } from "../interfaces/storeSale/sales/sales.component";
import { ModificarVentaComponent } from "../interfaces/storeSale/modificar-venta/modificar-venta.component";
import { authGuard } from "../guards/auth.guard";

export const ventasStore: Routes = [
  { path: 'listadoVentasStore', component: ListSalesComponent, canActivate:[authGuard]},
  {path: 'ventasTienda', component:SalesComponent, canActivate:[authGuard] },
  { path: 'modificarVenta/:idVenta', component: ModificarVentaComponent, canActivate:[authGuard] },

];