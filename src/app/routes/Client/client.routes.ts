import { Routes } from "@angular/router";
import { ListPedidosComponent } from "../../interfaces/ClienteOnline/list-pedidos/list-pedidos.component";

export const clients: Routes = [
  { path: 'cliente/PedidosEnvios', component: ListPedidosComponent},
];