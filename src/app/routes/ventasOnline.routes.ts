import { Routes } from '@angular/router';
import { DatosClienteComponent } from '../interfaces/saleOnline/DatosCliente/datos-cliente.component';
import { ListEnviosComponent } from '../interfaces/envios/list-envios/list-envios.component';
import { PagoQRComponent } from '../interfaces/saleOnline/pago-qr/pago-qr.component';
import { ListPedidoComponent } from '../interfaces/saleOnline/list-sale/list-sale.component';
import { authGuard } from '../guards/auth.guard';


export const ventasOnline: Routes = [
  { path: 'datosCliente', component: DatosClienteComponent, canActivate:[authGuard] },
  //direcciones para modulo envios
  
  //redireccion a la pagina de pago QR
  { path: 'pedidoOnline/pagoQR', component: PagoQRComponent, canActivate:[authGuard]},
  //listado de pedidos de la tienda online
  { path: 'pedidoOnline/Listado', component: ListPedidoComponent, canActivate:[authGuard]},
];