import { Routes } from "@angular/router";
import { ListSalesComponent } from "../interfaces/storeSale/list-sales/list-sales.component";
import { SalesComponent } from "../interfaces/storeSale/sales/sales.component";
import { ModificarVentaComponent } from "../interfaces/storeSale/modificar-venta/modificar-venta.component";

export const ventasStore: Routes = [
  { path: 'listadoVentasStore', component: ListSalesComponent},
  {path: 'ventasTienda', component:SalesComponent },
  { path: 'modificarVenta/:idVenta', component: ModificarVentaComponent },

];